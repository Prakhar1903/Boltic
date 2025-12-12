import { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle2, TrendingDown, TrendingUp, Package, Activity, BarChart3, Plus, X, Loader2, RefreshCw, Trash2 } from 'lucide-react';

import clsx from 'clsx';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';


// Types mimicking the webhook payload and internal state
type PricingDecision = 'MATCH_PRICE' | 'BUNDLE_OFFER' | 'HOLD';
type Status = 'PENDING' | 'APPROVED' | 'REJECTED';

interface ProductData {
    id: string;
    name: string;
    image: string;
    my_price: number;
    floor_price: number;
    competitor_price: number;
    competitor_name: string;
    decision: PricingDecision;
    reasoning: string;
    status: Status;
}

// Mock history generator for demo
const generateHistory = (basePrice: number) => {
    return Array.from({ length: 7 }, (_, i) => ({
        day: `Day ${i + 1}`,
        myPrice: basePrice,
        compPrice: basePrice + (Math.random() * 2000 - 1000)
    }));
};

// Calculate percent difference
const getProfitImpact = (myPrice: number, newPrice: number) => {
    if (!myPrice || !newPrice) return null;
    const diff = ((newPrice - myPrice) / myPrice) * 100;
    return diff;
};

const INITIAL_DATA: ProductData[] = [
    {
        id: '1',
        name: 'Samsung Galaxy S24 Ultra (Titanium Gray)',
        image: 'bg-gray-800',
        my_price: 115000,
        floor_price: 110000,
        competitor_price: 98000, // Below floor
        competitor_name: 'Amazon',
        decision: 'BUNDLE_OFFER',
        reasoning: 'Competitor price (₹98,000) is below our floor (₹110,000). Cannot match price without loss. Recommend value bundle to compete.',
        status: 'PENDING',
    },
    {
        id: '2',
        name: 'iPhone 15 Pro',
        image: 'bg-zinc-500',
        my_price: 134900,
        floor_price: 125000,
        competitor_price: 129000, // Safe match
        competitor_name: 'Flipkart',
        decision: 'MATCH_PRICE',
        reasoning: 'Competitor is selling at ₹129,000. Above our floor (₹125,000). Recommended price cut to match and win the Buy Box.',
        status: 'PENDING',
    },
    {
        id: '3',
        name: 'MacBook Pro 14 M3',
        image: 'bg-gray-500',
        my_price: 169900,
        floor_price: 160000,
        competitor_price: 175000, // Competitor higher
        competitor_name: 'Croma',
        decision: 'HOLD',
        reasoning: 'We are currently the cheapest option (₹169k vs ₹175k). Hold price to maximize margin.',
        status: 'APPROVED',
    },
];

const WEBHOOK_URL = "https://asia-south1.api.boltic.io/service/webhook/temporal/v1.0/05245678-66bd-4f6b-a3ee-a4fd5cbfd249/workflows/execute/2fca5837-c66a-406e-a5d0-17d70993a757";

export default function PriceMonitor() {
    const [products, setProducts] = useState<ProductData[]>(() => {
        // Load from local storage if available, else use initial data
        const saved = localStorage.getItem('products');
        return saved ? JSON.parse(saved) : INITIAL_DATA;
    });
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isRefreshing, setIsRefreshing] = useState(false);
    const [formData, setFormData] = useState({
        product_name: '',
        my_price: '',
        min_price: ''
    });

    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [expandedId, setExpandedId] = useState<string | null>(null);

    // Save to local storage whenever products change
    useEffect(() => {
        localStorage.setItem('products', JSON.stringify(products));
    }, [products]);

    const handleSelectAll = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.checked) {
            setSelectedIds(new Set(products.map(p => p.id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id: string) => {
        setSelectedIds(prev => {
            const newSet = new Set(prev);
            if (newSet.has(id)) {
                newSet.delete(id);
            } else {
                newSet.add(id);
            }
            return newSet;
        });
    };

    const handleDeleteSelected = async () => {
        if (!confirm(`Are you sure you want to delete ${selectedIds.size} products from the database?`)) return;

        // TODO: Replace with your actual Boltic Delete Workflow URL
        const DELETE_API_URL = "https://asia-south1.api.boltic.io/service/webhook/temporal/v1.0/05245678-66bd-4f6b-a3ee-a4fd5cbfd249/workflows/execute/799beb4b-1818-46c6-8b0d-0635e45801e8";

        setIsSubmitting(true); // Reuse submitting state for loading indicator

        try {
            // Optimistic update: remove from UI immediately
            const remaining = products.filter(p => !selectedIds.has(p.id));
            setProducts(remaining);
            localStorage.setItem('products', JSON.stringify(remaining));

            // Send single bulk delete request
            await fetch(DELETE_API_URL, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ ids: Array.from(selectedIds) })
            });

            setSelectedIds(new Set());
            alert(`Successfully deleted ${selectedIds.size} products from Boltic!`);

        } catch (error) {
            console.error("Delete failed:", error);
            alert("Deleted from dashboard, but failed to sync with Boltic. Please check console.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const fetchUpdatedData = async () => {
        setIsRefreshing(true);
        const GET_API_URL = "https://asia-south1.workflow.boltic.app/38aca56e-f172-4cc7-bdb2-3a2ef23704f8";

        try {
            const response = await fetch(GET_API_URL);
            const data = await response.json();

            console.log("Fetched raw data:", data);

            // Transform Boltic API data to match our ProductData interface
            const processed: ProductData[] = data.map((item: any) => {
                // New flat structure mapping
                return {
                    id: item.id,
                    name: item.product_name,
                    image: 'bg-blue-500', // Placeholder
                    my_price: item.my_price,
                    floor_price: item.min_price,
                    competitor_price: item.competitor_price || 0,
                    competitor_name: 'Online Market', // Default as source is not in top-level
                    decision: (item.ai_strategy || 'HOLD') as PricingDecision,
                    reasoning: item.latest_intel || 'Waiting for analysis...',
                    status: (item.status && item.status[0] ? item.status[0].toUpperCase() : 'PENDING') as Status
                };
            });

            setProducts(processed);
            alert("Dashboard updated with real-time data from Boltic!");
        } catch (error) {
            console.error("Fetch failed:", error);
            alert("Failed to fetch updates. Check console.");
        } finally {
            setIsRefreshing(false);
        }
    };

    const handleApprove = async (id: string) => {
        const product = products.find(p => p.id === id);
        if (!product) return;

        // Optimistic update
        const previousStatus = product.status;
        const updated = products.map(p =>
            p.id === id ? { ...p, status: 'APPROVED' as const } : p
        );
        setProducts(updated);

        const API_URL = "https://asia-south1.workflow.boltic.app/8e64fc6f-40e7-4ca5-8477-dda5dc79f0cb";
        // Determine new price based on decision logic
        // For MATCH_PRICE, we usually match the competitor. 
        // For BUNDLE_OFFER, the logic might preserve my_price or use a specific offer price.
        // Assuming matching competitor price for MATCH_PRICE and keeping current price for others for now, 
        // or user can clarify. The prompt example showed '1111111' which implies a specific value.
        // Using competitor_price for MATCH_PRICE seems safest default based on "MATCH".
        const newPrice = product.decision === 'MATCH_PRICE' ? product.competitor_price : product.my_price;

        try {
            const url = new URL(API_URL);
            url.searchParams.append("action", "done");
            url.searchParams.append("new_price", newPrice.toString());
            url.searchParams.append("product_id", product.id);

            const response = await fetch(url.toString(), {
                method: 'GET', // Example used axios.get
                headers: {
                    "Content-Type": "application/json",
                    // "user-agent": "{{user-agent}}" // Browser controls this, cannot override safely in client-side fetch
                }
            });

            if (!response.ok) {
                throw new Error(`API error: ${response.status}`);
            }

            console.log("Approve successful for", id);
            // Persist success state
            localStorage.setItem('products', JSON.stringify(updated));

        } catch (error) {
            console.error("Approve failed:", error);
            alert("Failed to approve. Reverting status.");
            // Revert on failure
            const reverted = products.map(p =>
                p.id === id ? { ...p, status: previousStatus } : p
            );
            setProducts(reverted);
        }
    };

    const handleAddProduct = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);

        try {
            // Workflow expects { "products": [ ... ] } based on loop2 configuration
            const payload = {
                products: [{
                    product_name: formData.product_name,
                    my_price: Number(formData.my_price),
                    min_price: Number(formData.min_price)
                }]
            };

            const response = await fetch(WEBHOOK_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                // Optimistically add to local state
                const newProduct: ProductData = {
                    id: crypto.randomUUID(),
                    name: formData.product_name,
                    image: 'bg-blue-500', // Default color
                    my_price: Number(formData.my_price),
                    floor_price: Number(formData.min_price),
                    competitor_price: 0, // Pending fetch
                    competitor_name: 'Pending Search...',
                    decision: 'HOLD',
                    reasoning: 'AI analysis initiated...',
                    status: 'PENDING'
                };

                const updatedList = [newProduct, ...products];
                setProducts(updatedList);
                localStorage.setItem('products', JSON.stringify(updatedList));

                setIsModalOpen(false);
                setFormData({ product_name: '', my_price: '', min_price: '' });
                alert('Workflow Initiated! Product added to dashboard.');
            } else {
                const responseData = await response.json();
                alert(`Failed to trigger workflow.\nStatus: ${response.status}\nMessage: ${responseData.message || 'Unknown error'}`);
            }
        } catch (error) {
            console.error('Error submitting form:', error);
            alert('Network error. Check console for details.');
        } finally {
            setIsSubmitting(false);
        }
    };

    const formatPrice = (p: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(p);
    };

    const getDecisionBadge = (decision: PricingDecision) => {
        switch (decision) {
            case 'MATCH_PRICE':
                return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-700/10"><TrendingDown className="h-3 w-3" /> Match Price</span>;
            case 'BUNDLE_OFFER':
                return <span className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-2 py-1 text-xs font-medium text-purple-700 ring-1 ring-inset ring-purple-700/10"><Package className="h-3 w-3" /> Bundle Offer</span>;
            case 'HOLD':
                return <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-2 py-1 text-xs font-medium text-green-700 ring-1 ring-inset ring-green-700/10"><Activity className="h-3 w-3" /> Hold</span>;
        }
    };

    return (
        <div className="space-y-8">


            {/* Header Actions */}
            <div className="flex items-center justify-between">
                <h1 className="text-2xl font-bold text-gray-900">Price Intelligence</h1>
                <div className="flex gap-2">
                    {selectedIds.size > 0 && (
                        <button
                            onClick={handleDeleteSelected}
                            className="flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 px-4 py-2 text-sm font-semibold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
                            disabled={isSubmitting}
                        >
                            {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                            Delete ({selectedIds.size})
                        </button>
                    )}
                    <button
                        onClick={fetchUpdatedData}
                        disabled={isRefreshing}
                        className="flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 transition-colors hover:bg-gray-50 disabled:opacity-50"
                    >
                        <RefreshCw className={clsx("h-4 w-4", isRefreshing && "animate-spin")} />
                        Refresh
                    </button>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-colors hover:bg-blue-500"
                    >
                        <Plus className="h-4 w-4" />
                        Add Product
                    </button>
                </div>
            </div>

            {/* Stats Overview */}
            <div className="grid gap-4 sm:grid-cols-3">
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-50 text-blue-600">
                            <Activity className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Active Products</p>
                            <h3 className="text-2xl font-bold text-gray-900">1,248</h3>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-orange-50 text-orange-600">
                            <AlertCircle className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Pending Actions</p>
                            <h3 className="text-2xl font-bold text-gray-900">{products.filter(p => p.status === 'PENDING').length}</h3>
                        </div>
                    </div>
                </div>
                <div className="rounded-xl border border-gray-200 bg-white p-6 shadow-sm">
                    <div className="flex items-center gap-4">
                        <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-green-50 text-green-600">
                            <BarChart3 className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-gray-500">Revenue Optimized</p>
                            <h3 className="text-2xl font-bold text-gray-900">+12.4%</h3>
                        </div>
                    </div>
                </div>
            </div>

            {/* Main Table */}
            <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm">
                <div className="border-b border-gray-200 bg-gray-50/50 px-6 py-4 flex items-center gap-4">
                    <input
                        type="checkbox"
                        checked={products.length > 0 && selectedIds.size === products.length}
                        onChange={handleSelectAll}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                    />
                    <h2 className="text-lg font-semibold text-gray-900">Price Intelligence Feed</h2>
                </div>
                <ul role="list" className="divide-y divide-gray-200">
                    {products.map((product) => (
                        <li key={product.id} className={clsx("p-6 transition-colors hover:bg-gray-50/50", selectedIds.has(product.id) && "bg-blue-50/30")}>
                            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">

                                {/* Product Info */}
                                <div className="flex items-start gap-4 lg:w-1/4">
                                    <div className="flex h-12 items-center">
                                        <input
                                            type="checkbox"
                                            checked={selectedIds.has(product.id)}
                                            onChange={() => handleSelectOne(product.id)}
                                            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-600"
                                        />
                                    </div>
                                    <div className={`h-12 w-12 flex-none rounded-lg ${product.image} bg-opacity-20`} />
                                    <div>
                                        <h3 className="font-semibold text-gray-900">{product.name}</h3>
                                        <p className="text-sm text-gray-500">ID: {product.id}</p>
                                    </div>
                                </div>

                                {/* Pricing Grid */}
                                <div className="grid flex-1 grid-cols-3 gap-8 border-x border-gray-100 px-8 text-sm">
                                    <div>
                                        <p className="text-gray-500">My Price</p>
                                        <p className="font-semibold text-gray-900">{formatPrice(product.my_price)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Floor Price</p>
                                        <p className="font-semibold text-gray-500">{formatPrice(product.floor_price)}</p>
                                    </div>
                                    <div>
                                        <p className="text-gray-500">Competitor ({product.competitor_name})</p>
                                        <p className={clsx("font-semibold",
                                            product.competitor_price < product.my_price ? "text-red-600" : "text-green-600"
                                        )}>
                                            {formatPrice(product.competitor_price)}
                                        </p>
                                    </div>
                                </div>

                                {/* AI Decision & Action */}
                                <div className="flex w-full flex-col gap-3 lg:w-1/3">
                                    <div className="flex items-center justify-between">
                                        {getDecisionBadge(product.decision)}
                                        {(() => {
                                            const impact = getProfitImpact(product.my_price, product.competitor_price);
                                            return impact !== null && product.decision === 'MATCH_PRICE' ? (
                                                <span className={clsx(
                                                    "inline-flex items-center rounded-full px-2 py-1 text-xs font-medium",
                                                    impact < 0 ? "bg-red-100 text-red-700" : "bg-green-100 text-green-700"
                                                )}>
                                                    {impact > 0 ? "+" : ""}{impact.toFixed(1)}% Margin
                                                </span>
                                            ) : null;
                                        })()}
                                    </div>

                                    <p className="text-xs text-gray-600 bg-gray-50 p-2 rounded border border-gray-100 italic">
                                        "{product.reasoning}"
                                    </p>

                                    <div className="flex items-center justify-between gap-2 mt-1">
                                        {product.status === 'APPROVED' ? (
                                            <span className="flex items-center gap-1 text-xs font-medium text-green-600">
                                                <CheckCircle2 className="h-3 w-3" /> Updated
                                            </span>
                                        ) : product.decision === 'MATCH_PRICE' || product.decision === 'BUNDLE_OFFER' ? (
                                            <button
                                                onClick={() => handleApprove(product.id)}
                                                className="flex-1 rounded-lg bg-gray-900 px-3 py-2 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-gray-800"
                                            >
                                                Approve
                                            </button>
                                        ) : (
                                            <span className="text-xs text-gray-400 font-medium">No Action Needed</span>
                                        )}

                                        <button
                                            onClick={() => setExpandedId(expandedId === product.id ? null : product.id)}
                                            className="text-xs text-blue-600 hover:text-blue-800 font-medium px-2"
                                        >
                                            {expandedId === product.id ? 'Hide Graph' : 'View Graph'}
                                        </button>
                                    </div>
                                </div>
                            </div>


                            {/* Chart Section (Expandable) */}
                            {expandedId === product.id && (
                                <div className="mt-6 border-t border-gray-100 pt-4 animate-in fade-in slide-in-from-top-4">
                                    <h4 className="text-sm font-semibold text-gray-700 mb-4">7-Day Price History</h4>
                                    <div className="h-64 w-full">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <LineChart data={generateHistory(product.my_price)}>
                                                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E7EB" />
                                                <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} />
                                                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#6B7280', fontSize: 12 }} domain={['auto', 'auto']} />
                                                <Tooltip
                                                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                                                />
                                                <Line type="monotone" dataKey="myPrice" name="My Price" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} />
                                                <Line type="monotone" dataKey="compPrice" name="Competitor" stroke="#DC2626" strokeWidth={3} strokeDasharray="5 5" dot={{ r: 4 }} />
                                            </LineChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </div>

            {/* Add Product Modal */}
            {
                isModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
                        <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-gray-900">Add Product to Monitor</h3>
                                <button
                                    onClick={() => setIsModalOpen(false)}
                                    className="text-gray-500 hover:text-gray-900"
                                >
                                    <X className="h-5 w-5" />
                                </button>
                            </div>

                            <form onSubmit={handleAddProduct} className="space-y-4">
                                <div>
                                    <label className="block text-sm font-medium text-gray-700">Product Name</label>
                                    <input
                                        type="text"
                                        required
                                        value={formData.product_name}
                                        onChange={e => setFormData({ ...formData, product_name: e.target.value })}
                                        className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                        placeholder="e.g. Sony WH-1000XM5"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">My Price (₹)</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.my_price}
                                            onChange={e => setFormData({ ...formData, my_price: e.target.value })}
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="25000"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700">Min Floor (₹)</label>
                                        <input
                                            type="number"
                                            required
                                            value={formData.min_price}
                                            onChange={e => setFormData({ ...formData, min_price: e.target.value })}
                                            className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                                            placeholder="22000"
                                        />
                                    </div>
                                </div>

                                <div className="pt-2">
                                    <button
                                        type="submit"
                                        disabled={isSubmitting}
                                        className="w-full flex items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-blue-500 disabled:opacity-50"
                                    >
                                        {isSubmitting ? (
                                            <>
                                                <Loader2 className="h-4 w-4 animate-spin" />
                                                Starting Workflow...
                                            </>
                                        ) : (
                                            'Start Monitoring'
                                        )}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                )
            }

        </div >
    );
}
