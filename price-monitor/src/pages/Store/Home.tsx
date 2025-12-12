import { useState, useEffect } from 'react';
import ProductCard from '../../components/ProductCard';



export default function StoreHome() {
    const [products, setProducts] = useState<any[]>([]);

    useEffect(() => {
        // Load products from local storage shared with Dashboard
        const saved = localStorage.getItem('products');
        if (saved) {
            try {
                const parsed = JSON.parse(saved);
                // Map Dashboard data structure to Store structure
                const mapped = parsed.map((p: any) => ({
                    id: p.id,
                    name: p.name,
                    price: p.my_price,
                    // Assign category based on name keywords for demo purposes, else generic
                    category: p.name.includes('iPhone') || p.name.includes('Samsung') ? 'Phone' :
                        p.name.includes('Mac') || p.name.includes('Laptop') ? 'Laptop' : 'Electronics',
                    imageColor: p.image || 'bg-blue-500'
                }));
                setProducts(mapped);
            } catch (e) {
                console.error("Failed to parse products from local storage");
            }
        }
    }, []);

    return (
        <div className="space-y-8">
            <div className="relative overflow-hidden rounded-3xl bg-gray-900 px-6 py-24 shadow-2xl sm:px-12 sm:py-32">
                <div className="relative z-10 max-w-2xl">
                    <h1 className="text-4xl font-bold tracking-tight text-white sm:text-6xl">
                        Next Gen Tech.
                        <br />
                        <span className="text-blue-400">Best Prices.</span>
                    </h1>
                    <p className="mt-6 text-lg text-gray-300">
                        Automated price matching puts the power back in your hands. Shop the latest gadgets with confidence.
                    </p>
                </div>
                <div className="absolute right-0 top-0 -mt-20 -mr-20 h-[500px] w-[500px] rounded-full bg-blue-600 opacity-20 blur-3xl" />
                <div className="absolute bottom-0 left-0 -mb-20 -ml-20 h-[500px] w-[500px] rounded-full bg-purple-600 opacity-20 blur-3xl" />
            </div>

            <div className="space-y-6">
                <h2 className="text-2xl font-bold text-gray-900">Trending Now</h2>
                {products.length === 0 ? (
                    <div className="text-center py-12 text-gray-500">
                        <p>No products available. Add some from the Dashboard!</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                        {products.map((product) => (
                            <ProductCard key={product.id} {...product} />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
