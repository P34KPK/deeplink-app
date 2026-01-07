"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

interface CheckoutButtonProps {
    priceId: string;
    label?: string;
    className?: string; // Allow quick tailwind overrides
}

export default function CheckoutButton({ priceId, label = "Subscribe", className = "" }: CheckoutButtonProps) {
    const [loading, setLoading] = useState(false);

    const handleCheckout = async () => {
        setLoading(true);
        try {
            const response = await fetch("/api/stripe/checkout", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    priceId,
                }),
            });

            const data = await response.json();

            if (data.error) {
                alert(`Checkout Error: ${data.error}`);
                console.error("Checkout Error:", data.error);
                return;
            }

            if (data.url) {
                window.location.href = data.url;
            } else {
                alert("Something went wrong. Please try again.");
            }
        } catch (error) {
            console.error("Error during checkout:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <button
            onClick={handleCheckout}
            disabled={loading}
            className={`relative inline-flex items-center justify-center px-6 py-3 overflow-hidden font-bold text-white transition-all duration-300 bg-indigo-600 rounded-lg group hover:bg-indigo-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-600 disabled:opacity-50 disabled:cursor-not-allowed ${className}`}
        >
            <span className="absolute w-0 h-0 transition-all duration-500 ease-out bg-white rounded-full group-hover:w-56 group-hover:h-56 opacity-10"></span>
            <span className="relative flex items-center gap-2">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {label}
            </span>
        </button>
    );
}
