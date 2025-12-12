import { ShoppingCart } from 'lucide-react';

interface ProductCardProps {
    name: string;
    price: number;
    imageColor: string;
    category: string;
}

export default function ProductCard({ name, price, imageColor, category }: ProductCardProps) {
    const formatPrice = (p: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            maximumFractionDigits: 0,
        }).format(p);
    };

    return (
        <div className="group relative overflow-hidden rounded-2xl bg-white border border-gray-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-1">
            <div className={`aspect-[4/3] w-full ${imageColor} bg-opacity-10 transition-colors group-hover:bg-opacity-20 flex items-center justify-center`}>
                <div className={`w-32 h-32 rounded-xl ${imageColor} shadow-inner opacity-50`} />
            </div>

            <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-gray-500">{category}</p>
                <h3 className="mt-1 text-lg font-bold text-gray-900 group-hover:text-blue-600 transition-colors">{name}</h3>

                <div className="mt-4 flex items-center justify-between">
                    <span className="text-xl font-bold text-gray-900">{formatPrice(price)}</span>
                    <button className="flex items-center gap-2 rounded-full bg-gray-900 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-gray-800">
                        <ShoppingCart className="h-4 w-4" />
                        Add
                    </button>
                </div>
            </div>
        </div>
    );
}
