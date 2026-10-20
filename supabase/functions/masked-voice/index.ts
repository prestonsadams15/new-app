import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

type CallRequest = {
  action: 'initiate';
  studentId: string;
  guardianContactId: string;
  schoolId: string;
};

const json = (body: unknown, status = 200) => new Response(JSON.stringify(body), {
  status,
  headers: { ...corsHeaders, 'Content-Type': 'application/json' },
});

const xml = (body: string) => new Response(body, {
  status: 200,
  headers: { 'Content-Type': 'text/xml; charset=utf-8' },
});

function xmlEscape(value: string): string {
  return value.replace(/[<>&"']/g, (character) => ({
    '<': '&lt;', '>': '&gt;', '&': '&amp;', '"': '&quot;', "'": '&apos;',
  })[character] ?? character);
}

function callbackUrl(mode: 'twiml' | 'status', callId: string, leg: 'staff' | 'guardian' = 'staff'): string {
  const base = Deno.env.get('TWILIO_WEBHOOK_BASE_URL');
  if (!base) throw new Error('TWILIO_WEBHOOK_BASE_URL is not configured');
  const url = new URL(base);
  url.searchParams.set('callback', mode);
  url.searchParams.set('call_id', callId);
  url.searchParams.set('leg', leg);
  return url.toString();
}

function constantTimeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) return false;
  let mismatch = 0;
  for (let index = 0; index < left.length; index += 1) mismatch |= left.charCodeAt(index) ^ right.charCodeAt(index);
  return mismatch === 0;
}

async function validateTwilioSignature(request: Request): Promise<boolean> {
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const signature = request.headers.get('x-twilio-signature');
  const publicBase = Deno.env.get('TWILIO_WEBHOOK_BASE_URL');
  if (!authToken || !signature || !publicBase) return false;

  const url = new URL(publicBase);
  url.search = new URL(request.url).search;
  const form = new URLSearchParams(await request.clone().text());
  const parameterString = [...new Set(form.keys())].sort()
    .map((key) => key + form.getAll(key).sort().join(''))
    .join('');
  const key = await crypto.subtle.importKey(
    'raw', new TextEncoder().encode(authToken),
    { name: 'HMAC', hash: 'SHA-1' }, false, ['sign'],
  );
  const digest = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(url.toString() + parameterString));
  const expected = btoa(String.fromCharCode(...new Uint8Array(digest)));
  return constantTimeEqual(signature, expected);
}

function getServiceClient() {
  const url = Deno.env.get('SUPABASE_URL');
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');
  if (!url || !key) throw new Error('Supabase service configuration is missing');
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });
}

async function handleTwilioCallback(request: Request, callback: string, callId: string): Promise<Response> {
  if (!await validateTwilioSignature(request)) return new Response('Forbidden', { status: 403 });
  const service = getServiceClient();

  if (callback === 'status') {
    const form = new URLSearchParams(await request.text());
    const leg = new URL(request.url).searchParams.get('leg') === 'guardian' ? 'guardian' : 'staff';
    const rawStatus = form.get('CallStatus') ?? '';
    const status = rawStatus === 'answered' ? 'in-progress' : rawStatus;
    const allowedStatuses = new Set(['queued', 'initiated', 'ringing', 'in-progress', 'completed', 'busy', 'no-answer', 'failed', 'canceled']);
    if (!allowedStatuses.has(status)) return new Response('Invalid status', { status: 400 });
    const duration = Number(form.get('CallDuration'));
    const update: Record<string, unknown> = {};
    const callSid = form.get('CallSid');
    if (callSid) update[leg === 'guardian' ? 'twilio_guardian_call_sid' : 'twilio_call_sid'] = callSid;
    if (leg === 'guardian' || status !== 'completed') update.status = status;
    if (status === 'in-progress') update.started_at = new Date().toISOString();
    if (['completed', 'busy', 'no-answer', 'failed', 'canceled'].includes(status)) {
      update.completed_at = new Date().toISOString();
      if (leg === 'guardian' && Number.isInteger(duration) && duration >= 0) update.duration_seconds = duration;
    }
    const { error } = await service.from('voice_call_audit').update(update).eq('id', callId);
    if (error) return new Response('Audit update failed', { status: 500 });
    return new Response('OK', { status: 200 });
  }

  if (callback === 'twiml') {
    const { data: audit } = await service.from('voice_call_audit')
      .select('id, district_id, school_id, student_id, guardian_contact_id, status')
      .eq('id', callId).maybeSingle();
    if (!audit || ['completed', 'busy', 'no-answer', 'failed', 'canceled'].includes(audit.status)) {
      return xml('<Response><Hangup/></Response>');
    }

    const [{ data: contact }, { data: route }] = await Promise.all([
      service.from('voice_call_guardian_contacts').select('phone_e164, voice_consent_at, active')
        .eq('id', audit.guardian_contact_id).eq('student_id', audit.student_id)
        .eq('district_id', audit.district_id).eq('school_id', audit.school_id).maybeSingle(),
      service.from('voice_call_routes').select('office_caller_id_e164, active, twilio_verified_at')
        .eq('district_id', audit.district_id).eq('school_id', audit.school_id).eq('active', true).maybeSingle(),
    ]);
    if (!contact?.active || !contact.voice_consent_at || !route?.active || !route.twilio_verified_at) {
      return xml('<Response><Hangup/></Response>');
    }

    const callerId = xmlEscape(route.office_caller_id_e164);
    const guardianPhone = xmlEscape(contact.phone_e164);
    const statusUrl = xmlEscape(callbackUrl('status', callId, 'guardian'));
    return xml(`<Response><Dial callerId="${callerId}" answerOnBridge="true" timeout="25"><Number statusCallback="${statusUrl}" statusCallbackMethod="POST" statusCallbackEvent="initiated ringing answered completed">${guardianPhone}</Number></Dial></Response>`);
  }
  return new Response('Not found', { status: 404 });
}

async function initiateCall(request: Request): Promise<Response> {
  const authorization = request.headers.get('authorization');
  const supabaseUrl = Deno.env.get('SUPABASE_URL');
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY');
  if (!authorization?.startsWith('Bearer ') || !supabaseUrl || !anonKey) return json({ error: 'Authentication required' }, 401);

  const callerClient = createClient(supabaseUrl, anonKey, {
    global: { headers: { Authorization: authorization } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error: authError } = await callerClient.auth.getUser();
  if (authError || !user) return json({ error: 'Authentication required' }, 401);

  let payload: CallRequest;
  try { payload = await request.json() as CallRequest; }
  catch { return json({ error: 'Invalid request body' }, 400); }
  const uuidPattern = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  if (payload.action !== 'initiate' || !uuidPattern.test(payload.studentId ?? '') || !uuidPattern.test(payload.guardianContactId ?? '') || !uuidPattern.test(payload.schoolId ?? '')) {
    return json({ error: 'Student, guardian contact, and school are required' }, 400);
  }

  const service = getServiceClient();
  const membershipQuery = () => service.from('voice_call_memberships')
    .select('district_id, school_id, can_call_guardians, active')
    .eq('user_id', user.id).eq('active', true).eq('can_call_guardians', true);
  const { data: schoolMembership } = await membershipQuery()
    .eq('school_id', payload.schoolId).maybeSingle();
  const { data: districtMembership } = schoolMembership
    ? { data: null }
    : await membershipQuery().is('school_id', null).maybeSingle();
  const membership = schoolMembership ?? districtMembership;
  if (!membership) return json({ error: 'Calling is not enabled for this staff account' }, 403);
  const callSchoolId = payload.schoolId;

  const [{ data: staff }, { data: contact }, { data: route }] = await Promise.all([
    service.from('voice_call_staff_endpoints').select('phone_e164, verified_at, active')
      .eq('user_id', user.id).eq('district_id', membership.district_id).eq('school_id', callSchoolId).maybeSingle(),
    service.from('voice_call_guardian_contacts').select('id, student_id, district_id, school_id, phone_e164, voice_consent_at, active')
      .eq('id', payload.guardianContactId).eq('student_id', payload.studentId)
      .eq('district_id', membership.district_id).eq('school_id', callSchoolId).eq('active', true).maybeSingle(),
    service.from('voice_call_routes').select('office_caller_id_e164, active, twilio_verified_at')
      .eq('district_id', membership.district_id).eq('school_id', callSchoolId).eq('active', true).maybeSingle(),
  ]);
  if (!staff?.active || !staff.verified_at || !contact?.active || !contact.voice_consent_at || !route?.twilio_verified_at) {
    return json({ error: 'A verified staff phone, guardian voice consent, and verified school caller ID are required' }, 403);
  }

  const recentCutoff = new Date(Date.now() - 60_000).toISOString();
  const { count: activeCallCount, error: activeCallError } = await service.from('voice_call_audit')
    .select('id', { count: 'exact', head: true })
    .eq('staff_user_id', user.id)
    .in('status', ['queued', 'initiated', 'ringing', 'in-progress'])
    .gte('initiated_at', recentCutoff);
  if (activeCallError) return json({ error: 'Unable to verify call limits' }, 500);
  if ((activeCallCount ?? 0) > 0) return json({ error: 'A recent call is still active. Try again after it ends.' }, 429);

  const { data: audit, error: auditError } = await service.from('voice_call_audit').insert({
    district_id: membership.district_id,
    school_id: callSchoolId,
    staff_user_id: user.id,
    student_id: payload.studentId,
    guardian_contact_id: contact.id,
    school_caller_id_e164: route.office_caller_id_e164,
    status: 'queued',
  }).select('id').single();
  if (auditError || !audit) return json({ error: 'Unable to create call audit entry' }, 500);

  const accountSid = Deno.env.get('TWILIO_ACCOUNT_SID');
  const authToken = Deno.env.get('TWILIO_AUTH_TOKEN');
  const twilioFrom = Deno.env.get('TWILIO_VOICE_NUMBER');
  if (!accountSid || !authToken || !twilioFrom) {
    await service.from('voice_call_audit').update({ status: 'failed', provider_error_code: 'CONFIG_MISSING' }).eq('id', audit.id);
    return json({ error: 'Voice gateway is not configured' }, 503);
  }

  const form = new URLSearchParams({
    To: staff.phone_e164,
    From: twilioFrom,
    Url: callbackUrl('twiml', audit.id),
    Method: 'POST',
    Timeout: '25',
    StatusCallback: callbackUrl('status', audit.id),
    StatusCallbackMethod: 'POST',
    StatusCallbackEvent: 'initiated ringing answered completed',
  });
  const basicAuth = btoa(`${accountSid}:${authToken}`);
  const twilioResponse = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basicAuth}`, 'Content-Type': 'application/x-www-form-urlencoded' },
    body: form,
  });
  const result = await twilioResponse.json().catch(() => ({}));
  if (!twilioResponse.ok) {
    await service.from('voice_call_audit').update({ status: 'failed', provider_error_code: String(result.code ?? 'TWILIO_ERROR') }).eq('id', audit.id);
    return json({ error: 'The voice provider could not start this call' }, 502);
  }

  await service.from('voice_call_audit').update({ twilio_call_sid: result.sid, status: 'initiated' }).eq('id', audit.id).eq('status', 'queued');
  return json({ callId: audit.id, status: 'initiated', schoolCallerId: route.office_caller_id_e164, message: 'Your phone will ring first. The guardian will be called after you answer.' }, 202);
}

Deno.serve(async (request) => {
  if (request.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });
  const url = new URL(request.url);
  const callback = url.searchParams.get('callback');
  const callId = url.searchParams.get('call_id');
  if (callback && callId && request.method === 'POST') {
    try { return await handleTwilioCallback(request, callback, callId); }
    catch { return new Response('Gateway callback failed', { status: 500 }); }
  }
  if (request.method !== 'POST') return json({ error: 'Method not allowed' }, 405);
  try { return await initiateCall(request); }
  catch { return json({ error: 'Unable to initiate the call' }, 500); }
});