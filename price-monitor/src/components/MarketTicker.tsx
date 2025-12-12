import { TrendingUp, TrendingDown, RefreshCw } from 'lucide-react';
import clsx from 'clsx';
import { useEffect, useState } from 'react';

const MOCK_EVENTS = [
    { message: "Amazon lowered iPhone 15 price by ₹1,500", type: "down" },
    { message: "Flipkart raised Samsung S24 Ultra by ₹2,000", type: "up" },
    { message: "Croma running flash sale on Sony XM5", type: "down" },
    { message: "OnePlus Nord 5 stock running low on Amazon", type: "neutral" },
    { message: "New competitor detected for AirPods Pro", type: "neutral" },
    { message: "Reliance Digital dropped Pixel 8 price", type: "down" },
];

export default function MarketTicker() {
    return (
        <div className="w-full bg-gray-900 overflow-hidden py-2 shadow-md">
            <div className="relative flex items-center">
                <div className="absolute left-0 z-10 bg-gradient-to-r from-gray-900 to-transparent w-8 h-full"></div>
                <div className="absolute right-0 z-10 bg-gradient-to-l from-gray-900 to-transparent w-8 h-full"></div>

                {/* Ticker Animation */}
                <div className="animate-ticker flex whitespace-nowrap">
                    {/* Duplicate events to create seamless loop */}
                    {[...MOCK_EVENTS, ...MOCK_EVENTS, ...MOCK_EVENTS].map((event, i) => (
                        <div key={i} className="inline-flex items-center mx-8">
                            {event.type === 'down' ? (
                                <TrendingDown className="text-green-400 w-4 h-4 mr-2" />
                            ) : event.type === 'up' ? (
                                <TrendingUp className="text-red-400 w-4 h-4 mr-2" />
                            ) : (
                                <RefreshCw className="text-blue-400 w-4 h-4 mr-2" />
                            )}
                            <span className={clsx(
                                "text-sm font-medium",
                                event.type === 'down' ? "text-green-400" :
                                    event.type === 'up' ? "text-red-400" : "text-blue-300"
                            )}>
                                {event.message}
                            </span>
                        </div>
                    ))}
                </div>
            </div>
        </div>
    );
}
