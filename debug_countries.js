// Debug script to test countries API and data processing
const API_BASE = 'http://localhost:8000';

async function testCountriesAPI() {
    try {
        console.log('🔍 Testing countries API...');
        
        const response = await fetch(`${API_BASE}/clarisa/countries/`);
        const data = await response.json();
        
        console.log('✅ API Response:', {
            success: data.success,
            count: data.count,
            firstFew: data.data.slice(0, 5)
        });
        
        // Test the filtering logic from Step2.tsx
        const filteredCountries = data.data.filter(item => 
            item.country_name !== 'All' && 
            !item.country_name.toLowerCase().includes('all')
        );
        
        console.log('🔧 After filtering:', {
            originalCount: data.data.length,
            filteredCount: filteredCountries.length,
            firstFewFiltered: filteredCountries.slice(0, 5)
        });
        
        // Test the mapping logic
        const mappedCountries = filteredCountries.map(item => ({
            value: item.country_id,
            label: item.country_name
        }));
        
        console.log('🎯 Final mapped data:', {
            count: mappedCountries.length,
            sample: mappedCountries.slice(0, 10)
        });
        
    } catch (error) {
        console.error('❌ Error:', error);
    }
}

// Run the test
testCountriesAPI();
