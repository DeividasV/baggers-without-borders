# Country and Region Selector Components

## Overview

Two new reusable components have been created for selecting countries and regions:

- `CountrySelect` - For selecting countries
- `RegionSelect` - For selecting regions/states within a country

These components provide a better user experience with features like:

- Searchable dropdowns
- Grouped countries by continent
- Dynamic region loading
- Clear/reset functionality
- Loading indicators
- Keyboard navigation

## Components

### CountrySelect

A searchable dropdown for selecting countries, grouped by continent.

**Features:**

- Countries are grouped by continent (Africa, Antarctica, Asia, Europe, North America, Oceania, South America)
- Search functionality to filter countries
- Clear button to reset selection
- Loading state while fetching countries
- Keyboard accessible

**Props:**

```typescript
interface CountrySelectProps {
  label?: string; // Label for the field
  value?: string; // Selected country code (2 or 3 letter)
  onChange: (value: string, country?: Country) => void; // Callback when selection changes
  placeholder?: string; // Placeholder text
  error?: string; // Error message to display
  disabled?: boolean; // Disable the component
}
```

**Example Usage:**

```tsx
import { CountrySelect } from "@/app/components/ui";

<CountrySelect
  label="Birth Country"
  value={formData.birthCountry}
  onChange={(value, country) => {
    setFormData({ ...formData, birthCountry: value });
    console.log("Selected country:", country);
  }}
  placeholder="Select a country"
/>;
```

### RegionSelect

A searchable dropdown for selecting regions/states within a selected country.

**Features:**

- Dynamically loads regions based on selected country
- Only enabled when a country is selected
- Shows region type (state, province, region, etc.)
- Search functionality to filter regions
- Clear button to reset selection
- Loading indicator while fetching regions
- Keyboard accessible

**Props:**

```typescript
interface RegionSelectProps {
  label?: string; // Label for the field
  value?: string; // Selected region name
  onChange: (value: string, region?: Region) => void; // Callback when selection changes
  countryCode?: string; // Country code to load regions for
  placeholder?: string; // Placeholder text
  error?: string; // Error message to display
  disabled?: boolean; // Disable the component
}
```

**Example Usage:**

```tsx
import { CountrySelect, RegionSelect } from "@/app/components/ui";

const [country, setCountry] = useState("");
const [region, setRegion] = useState("");

<CountrySelect
  label="Residence Country"
  value={country}
  onChange={(value) => {
    setCountry(value);
    // Clear region when country changes
    setRegion("");
  }}
/>

<RegionSelect
  label="Residence Region/State"
  value={region}
  countryCode={country}
  onChange={(value) => setRegion(value)}
  placeholder="Select a region"
/>
```

## API Endpoints

### GET /api/countries

Returns all countries grouped by continent.

**Response:**

```json
{
  "countries": [
    {
      "id": "...",
      "code": "US",
      "code3": "USA",
      "name": "United States",
      "continent": "North America",
      "hasRegions": true
    }
  ],
  "grouped": {
    "North America": [...],
    "Europe": [...],
    ...
  }
}
```

### GET /api/regions?countryCode={code}

Returns all regions for a specific country.

**Parameters:**

- `countryCode` - 2 or 3 letter country code (e.g., "US" or "USA")

**Response:**

```json
{
  "regions": [
    {
      "id": "...",
      "code": "US-CA",
      "name": "California",
      "type": "state"
    }
  ]
}
```

## Database Schema

The components use the following database models:

### Country

- `id` - Unique identifier
- `code` - ISO 3166-1 alpha-2 code (e.g., "US")
- `code3` - ISO 3166-1 alpha-3 code (e.g., "USA")
- `name` - Country name
- `continent` - Continent name
- `hasRegions` - Whether the country has regions

### Region

- `id` - Unique identifier
- `code` - Region code (e.g., "US-CA")
- `name` - Region name
- `type` - Region type (state, province, etc.)
- `countryId` - Reference to country

## Integration Example

Here's a complete example from `UserProfile.tsx`:

```tsx
<CountrySelect
  label="Residence Country"
  value={formData.residenceCountry}
  onChange={(value, country) => {
    setFormData({ ...formData, residenceCountry: value });
    // Clear region when country changes
    if (value !== formData.residenceCountry) {
      setFormData((prev) => ({ ...prev, residenceRegion: "" }));
    }
  }}
  placeholder="Select country"
/>

<RegionSelect
  label="Residence Region/State"
  value={formData.residenceRegion}
  countryCode={formData.residenceCountry}
  onChange={(value) => {
    setFormData({ ...formData, residenceRegion: value });
  }}
  placeholder="Select region"
/>
```

## Styling

Both components use the existing dark theme styling from the application:

- Dark backgrounds (`bg-dark-700`, `bg-dark-600`)
- Primary color accents for active states
- Consistent border and hover states
- Smooth transitions and animations

## Future Enhancements

Possible improvements:

- Add country flags
- Support for multiple selections
- Virtualized lists for better performance with large datasets
- Cached country/region data to reduce API calls
- Support for filtering by region type
