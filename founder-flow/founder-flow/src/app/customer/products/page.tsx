"use client";

import { useEffect, useState } from "react";
import { getExploreProducts, trackCustomerEvent } from "@/lib/customer-service";
import { useAuth } from "@/context/AuthContext";
import { ProductDiscoveryItem } from "@/lib/types/customer";
import {
    Rocket,
    MessageSquare,
    ArrowUpRight,
    Star
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function ExploreProductsPage() {
    const { user } = useAuth();
    const router = useRouter();
    const [products, setProducts] = useState<ProductDiscoveryItem[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const load = async () => {
            try {
                const items = await getExploreProducts();
                setProducts(items);
            } catch (error) {
                console.error("Failed to load products:", error);
            } finally {
                setLoading(false);
            }
        };
        load();
    }, []);

    const handleViewProduct = async (product: ProductDiscoveryItem) => {
        if (user) {
            await trackCustomerEvent(user.uid, product.startupId, "view_product");
        }
        // Redirect to feedback detailed view
        router.push(`/customer/feedback/${product.startupId}`);
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-[50vh]">
                <div className="w-6 h-6 border-2 border-black dark:border-white border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div className="space-y-8">
            <header>
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">
                    Explore Products
                </h1>
                <p className="text-zinc-500 dark:text-zinc-400 mt-2">
                    Discover startups seeking feedback and beta testers.
                </p>
            </header>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.length > 0 ? (
                    products.map((product) => (
                        <div
                            key={product.startupId}
                            onClick={() => handleViewProduct(product)}
                            className="group cursor-pointer p-6 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white transition-all hover:shadow-lg flex flex-col h-full"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-zinc-100 to-zinc-200 dark:from-zinc-800 dark:to-zinc-700 flex items-center justify-center">
                                    <Rocket className="w-5 h-5 text-zinc-600 dark:text-zinc-300" />
                                </div>
                                {product.betaActive && (
                                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded text-[10px] font-bold uppercase">
                                        Beta Active
                                    </span>
                                )}
                            </div>

                            <div className="flex-1 mb-4">
                                <h3 className="font-bold text-lg mb-2 line-clamp-1">{product.idea}</h3>
                                <p className="text-sm text-zinc-500 line-clamp-2">
                                    Help validate this idea. The founder is looking for feedback on core features.
                                </p>
                            </div>

                            {product.incentive && (
                                <div className="mb-4 px-3 py-2 bg-amber-50 dark:bg-amber-900/10 rounded-lg flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-500">
                                    <Star className="w-3 h-3 fill-current" />
                                    Reward: {product.incentive}
                                </div>
                            )}

                            <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800 flex items-center justify-between text-sm font-bold">
                                <span className="flex items-center gap-1 text-zinc-500 group-hover:text-black dark:group-hover:text-white transition-colors">
                                    <MessageSquare className="w-4 h-4" />
                                    Give Feedback
                                </span>
                                <ArrowUpRight className="w-4 h-4 text-zinc-300 group-hover:text-black dark:group-hover:text-white transition-colors" />
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="col-span-full py-12 text-center text-zinc-400">
                        No active startups found. Check back later!
                    </div>
                )}
            </div>
        </div>
    );
}
