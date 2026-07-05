/**
 * A real `search_grants` response (query: "weatherization energy efficiency
 * building insulation home retrofit", orgType: "Small Business"), captured live
 * from Granted. Used to pin the parser to actual output.
 */
export const WEATHERIZATION_SEARCH_FIXTURE = `Found 6 active grants matching "weatherization energy efficiency building insulation home retrofit":

---
**Rural Energy for America Program (REAP) Renewable Energy Systems & Energy Efficiency Improvement Guaranteed Loans & Grants** [High Confidence] | Fit: 63/99
Funder: USDA Rural Development
Deadline: No deadline
Amount: Loan guarantees up to 75% of total eligible project costs; Grants for up to 50% of total eligible project costs (minimum $1,500, maximum $500,000 for energy efficiency, $2,500 to $1 million for renewable energy systems).
Summary: The REAP program offers guaranteed loan financing and grant funding to agricultural producers and rural small businesses for renewable energy systems or to make energy efficiency improvements. This includes upgrades like insulation, high-efficiency HVAC, lighting, and more.
Apply: https://sustainableagriculture.net/publications/grassrootsguide/renewable-energy/renewable-energy-energy-efficiency/
Details: https://grantedai.com/grants/rural-energy-for-america-program-reap-renewable-energy-systems-energy-ef-usda-rural-development-33d68005

Why: Matches your focus: "energy efficiency"; Matches your focus: insulation; Open to Small Business organizations
---
**Building Energy Efficiency (BEE) Grant Program** [High Confidence] | Fit: 54/99
Funder: Prosper Portland
Deadline: No deadline
Amount: Up to $200,000 for commercial property owners (25% match required); up to $100,000 for small business tenants (no match required).
Summary: The BEE Grant Program supports small businesses and small commercial building owners in Portland to fund energy-efficient upgrades, which include insulation and building envelope improvements, lighting upgrades, and HVAC systems.
Apply: https://prosperportland.us/our-work/building-energy-efficiency-bee-grant/
Details: https://grantedai.com/grants/building-energy-efficiency-bee-grant-program-prosper-portland-aa2017ce

Why: Matches your focus: "energy efficiency"; Matches your focus: building; Matches your focus: insulation; Open to Small Business organizations
---
**Weatherization Assistance Program (WAP)** [High Confidence] | Fit: 40/99
Funder: Pennsylvania Department of Community and Economic Development
Deadline: No deadline
Amount: Not specified
Summary: Weatherization Assistance Program (WAP) is sponsored by Pennsylvania Department of Community and Economic Development.
Apply: https://dced.pa.gov/programs/weatherization-assistance-program-wap/
Details: https://grantedai.com/grants/weatherization-assistance-program-wap-pennsylvania-department-of-community-and-532ad009

Why: Matches your focus: "energy efficiency"; Matches your focus: weatherization; Matches your focus: insulation; Topic match

## Next Steps
- Use **get_grant**("rural-energy-for-america-program-reap-renewable-energy-systems-energy-ef-usda-rural-development-33d68005") for full eligibility details on the top result
- Use **search_funders**("USDA Rural Development") to research this funder's giving history`;
