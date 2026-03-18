"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";

export default function ClientSearch() {
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState("");

    const handleSearch = () => {
        if (searchTerm.trim()) {
            router.push(`/ilanlar?q=${encodeURIComponent(searchTerm.trim())}`);
        } else {
            router.push('/ilanlar');
        }
    };

    return (
        <div className="flex flex-col sm:flex-row gap-4 max-w-md">
            <div className="flex-1 bg-white/90 backdrop-blur-sm border border-slate-200 rounded-lg p-1.5 flex transition-all shadow-sm focus-within:ring-2 focus-within:ring-[#89A8B2]/20 focus-within:border-[#89A8B2]">
                <input
                    type="text"
                    placeholder="Yazılımcı, Tasarımcı, Çevirmen..."
                    className="flex-1 px-4 py-3 outline-none text-slate-700 bg-transparent placeholder:text-slate-400"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                />
                <button
                    onClick={handleSearch}
                    className="bg-[#1E293B] text-white px-6 py-3 rounded-md font-semibold hover:bg-[#334155] transition-all flex items-center gap-2"
                >
                    <Search className="w-4 h-4" />
                    Ara
                </button>
            </div>
        </div>
    );
}
