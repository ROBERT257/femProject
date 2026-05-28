// Simple integration test that talks to the local backend. Requires server running at http://localhost:8080

(async function(){
  const base = 'http://localhost:8080';
  try {
    console.log('Checking /health...');
    let r = await fetch(base + '/health');
    console.log('/health', r.status, await r.text());

    console.log('Listing plans...');
    r = await fetch(base + '/rehab-plans');
    console.log('/rehab-plans', r.status);
    const plans = await r.json().catch(()=>null);
    console.log('plans count:', Array.isArray(plans)?plans.length:'?');

    console.log('Creating a test plan...');
    r = await fetch(base + '/rehab-plans', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patient_name: 'E2E Test',
        therapist_name: 'Tester',
        title: 'E2E Sample',
        goal: 'Test create',
        status: 'active',
        entries: [
          { exercise: 'Squat', sets: 3, reps: 5, order_index: 1, completion_status: 'pending', pain_level: 1 }
        ]
      })
    });
    console.log('create status', r.status);
    const created = await r.json();
    console.log('created id', created.id);

    console.log('Fetching created plan...');
    r = await fetch(base + `/rehab-plans/${created.id}`);
    console.log('get status', r.status);
    const fetched = await r.json();
    console.log('fetched.title', fetched.title);

    console.log('Loading progress...');
    r = await fetch(base + `/rehab-plans/${created.id}/progress`);
    console.log('progress status', r.status);
    const prog = await r.json();
    console.log('progress', prog);

    console.log('Cleaning up: deleting plan');
    r = await fetch(base + `/rehab-plans/${created.id}`, { method: 'DELETE' });
    console.log('delete status', r.status);

    console.log('E2E test complete');
  } catch (e) {
    console.error('E2E failed', e);
    process.exit(2);
  }
})();
