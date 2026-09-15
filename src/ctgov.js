const UA = 'ClinicalTrialTracker/0.1 (+contact: clinical-trial-tracker-admin@example.com)';

const TRANSIENT_STATUSES = new Set([429, 500, 502, 503, 504]);
const MAX_ATTEMPTS = 4;
const REQUEST_TIMEOUT_MS = 15_000;

function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options) {
    let lastError;
    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
        let res;
        try {
            res = await fetch(url, { ...options, signal: controller.signal });
        } catch (err) {
            lastError = err.name === 'AbortError' ? new Error(`Request timed out after ${REQUEST_TIMEOUT_MS}ms: ${url}`) : err;
            if (attempt < MAX_ATTEMPTS) {
                await sleep(1000 * 2 ** (attempt - 1));
                continue;
            }
            throw lastError;
        } finally {
            clearTimeout(timeoutId);
        }
        if (res.ok) return res;
        if (!TRANSIENT_STATUSES.has(res.status)) {
            throw new Error(`ClinicalTrials.gov request failed: ${res.status} ${res.statusText}`);
        }
        lastError = new Error(`ClinicalTrials.gov request failed: ${res.status} ${res.statusText}`);
        if (attempt < MAX_ATTEMPTS) await sleep(1000 * 2 ** (attempt - 1));
    }
    throw lastError;
}

const STATUS_MAP = {
    new: 'RECRUITING,NOT_YET_RECRUITING',
    completed: 'COMPLETED',
    terminated: 'TERMINATED,WITHDRAWN,SUSPENDED',
};

const FIELDS = 'NCTId,BriefTitle,OverallStatus,Phase,LeadSponsorName,Condition,LocationCountry,StudyFirstPostDate,StartDate,BriefSummary';

function isoDate(d) {
    return d.toISOString().slice(0, 10);
}

export async function fetchTrials({ condition, sponsor, phase, status, country, startDate, endDate, limit }) {
    const advanced = [`AREA[StudyFirstPostDate]RANGE[${isoDate(startDate)},${isoDate(endDate)}]`];
    if (sponsor) advanced.push(`AREA[LeadSponsorName]${sponsor}`);
    if (phase && phase !== 'all') advanced.push(`AREA[Phase]${phase}`);
    if (country) advanced.push(`AREA[LocationCountry]${country}`);

    const params = new URLSearchParams({
        'filter.advanced': advanced.join(' AND '),
        pageSize: String(limit),
        sort: 'StudyFirstPostDate:desc',
        fields: FIELDS,
    });
    if (condition) params.set('query.cond', condition);
    if (status && status !== 'all') params.set('filter.overallStatus', STATUS_MAP[status]);

    const res = await fetchWithRetry(`https://clinicaltrials.gov/api/v2/studies?${params}`, { headers: { 'User-Agent': UA } });
    const data = await res.json();
    return (data.studies ?? []).map((study) => {
        const p = study.protocolSection ?? {};
        const locations = p.contactsLocationsModule?.locations ?? [];
        const countries = [...new Set(locations.map((l) => l.country).filter(Boolean))];
        const summary = p.descriptionModule?.briefSummary ?? '';

        return {
            nctId: p.identificationModule?.nctId,
            studyUrl: p.identificationModule?.nctId ? `https://clinicaltrials.gov/study/${p.identificationModule.nctId}` : null,
            briefTitle: p.identificationModule?.briefTitle,
            overallStatus: p.statusModule?.overallStatus,
            phases: p.designModule?.phases ?? [],
            leadSponsor: p.sponsorCollaboratorsModule?.leadSponsor?.name ?? null,
            conditions: p.conditionsModule?.conditions ?? [],
            countries,
            siteCount: locations.length,
            briefSummary: summary.length > 600 ? `${summary.slice(0, 600)}…` : summary,
            studyFirstPostDate: p.statusModule?.studyFirstPostDateStruct?.date ?? null,
            startDate: p.statusModule?.startDateStruct?.date ?? null,
        };
    });
}
