import { Actor, log } from 'apify';
import { fetchTrials } from './ctgov.js';

await Actor.init();

const input = (await Actor.getInput()) ?? {};
const { condition, sponsor, phase = 'all', status = 'new', country, daysBack = 14, maxResults = 25 } = input;

/** Must match the event name configured in this Actor's pay-per-event pricing on Apify. */
const TRIAL_SEARCH_EVENT = 'trial-search';

const endDate = new Date();
const startDate = new Date(endDate.getTime() - daysBack * 24 * 60 * 60 * 1000);

const trials = await fetchTrials({
    condition,
    sponsor,
    phase,
    status,
    country,
    startDate,
    endDate,
    limit: Math.min(maxResults, 100),
});

for (const trial of trials) {
    await Actor.pushData(trial);
}

await Actor.charge({ eventName: TRIAL_SEARCH_EVENT });

log.info(`Pushed ${trials.length} trial(s)`);

await Actor.exit();
