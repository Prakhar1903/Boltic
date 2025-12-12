const WEBHOOK_URL = "https://asia-south1.api.boltic.io/service/webhook/temporal/v1.0/05245678-66bd-4f6b-a3ee-a4fd5cbfd249/workflows/execute/2fca5837-c66a-406e-a5d0-17d70993a757";

const products = [
    {
        product_name: "Apple iPad Pro 11\" M4 (256GB, Space Black)",
        my_price: 99900,
        min_price: 95000
    },
    {
        product_name: "Sony PlayStation 5 Slim Console (Disc Edition)",
        my_price: 54990,
        min_price: 49000
    },
    {
        product_name: "GoPro HERO12 Black",
        my_price: 37990,
        min_price: 35000
    },
    {
        product_name: "Dyson Airwrap Multi-styler (Ceramic Pink)",
        my_price: 45900,
        min_price: 42000
    },
    {
        product_name: "Dell XPS 13 Laptop (Intel Core Ultra 7)",
        my_price: 145000,
        min_price: 135000
    }
];

async function seed() {
    console.log(`🚀 Starting to seed ${products.length} products to Boltic...`);

    for (const [index, p] of products.entries()) {
        const payload = { products: [p] }; // Array of 1 as per loop2 config

        try {
            console.log(`[${index + 1}/${products.length}] Sending: ${p.product_name}...`);
            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload)
            });

            if (response.ok) {
                console.log(`   ✅ Success!`);
            } else {
                console.log(`   ❌ Failed: ${response.status} ${response.statusText}`);
                const text = await response.text();
                console.log(`      ${text}`);
            }
        } catch (error) {
            console.error(`   ❌ Error: ${error.message}`);
        }

        // Small delay to be nice to the API
        await new Promise(r => setTimeout(r, 1000));
    }

    console.log("\n✨ Seeding complete! Check your Boltic Dashboard/Table in a few moments.");
}

seed();
