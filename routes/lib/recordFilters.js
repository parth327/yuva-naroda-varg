// Shared between the legacy EJS admin routes (routes/admin.js) and the new
// JSON admin API (routes/api/adminApi.js) so the record-list filter panel's
// option lists and query-param extraction live in exactly one place.

// Filter dropdown option lists — mirror the registration form's choices
// (views/register.ejs) so admins can filter on exactly what users could pick.
const FILTER_OPTIONS = {
  locations: ['કૃષ્ણા નગર', 'કુબેરનગર', 'સૈજપુર', 'સરદારનગર', 'નરોડા', 'હરિદર્શન', 'અન્ય'],
  interests: ['સેવા', 'પર્યાવરણ', 'વાંચન', 'લેખન', 'વક્તા', 'રમત', 'અન્ય'],
  joinMediums: ['શાખા', 'સાપ્તાહિક મિલન', 'અન્ય'],
  genders: ['Male', 'Female', 'Other'],
};

// Pulls the user-list filter panel's fields out of req.query.
function extractRecordFilters(query) {
  return {
    search: query.search || '',
    location: query.location || '',
    education: query.education || '',
    interest: query.interest || '',
    joinMedium: query.joinMedium || '',
    gender: query.gender || '',
    ageMin: query.ageMin || '',
    ageMax: query.ageMax || '',
    dateFrom: query.dateFrom || '',
    dateTo: query.dateTo || '',
  };
}

module.exports = { FILTER_OPTIONS, extractRecordFilters };
