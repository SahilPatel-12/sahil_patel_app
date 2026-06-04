const fetch = require('node-fetch');

const testHealth = async () => {
    const requestUrl = "https://mantrapuja.com/api/health";
    console.log("[API] URL:", requestUrl);
    
    try {
        const response = await fetch(requestUrl);
        console.log("[API] Response Status:", response.status);
        
        const bodyText = await response.text();
        console.log("[API] Response Body:", bodyText);
    } catch (error) {
        console.error("[API] Error:", error);
    }
};

testHealth();
