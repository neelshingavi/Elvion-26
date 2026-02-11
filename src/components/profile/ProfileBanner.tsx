"use client";

import { Upload, Camera, Loader2 } from "lucide-react";
import { useState } from "react";
import { uploadProfileImage } from "@/lib/profile-service";
import { cn } from "@/lib/utils";

interface ProfileBannerProps {
    uid: string;
    bannerURL?: string;
    photoURL?: string;
    displayName?: string;
    onUpdate: (field: 'photoURL' | 'bannerURL', url: string) => void;
}

export function ProfileBanner({ uid, bannerURL, photoURL, displayName, onUpdate }: ProfileBannerProps) {
    const [uploading, setUploading] = useState<'avatar' | 'banner' | null>(null);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        const file = e.target.files?.[0];
        if (!file) return;

        setUploading(type);
        try {
            const url = await uploadProfileImage(uid, file, type);
            onUpdate(type === 'avatar' ? 'photoURL' : 'bannerURL', url);
        } catch (error: any) {
            alert(error.message || "Upload failed");
        } finally {
            setUploading(null);
        }
    };

    return (
        <div className="relative group">
            {/* Banner */}
            <div
                className="h-48 w-full relative bg-surface-alt overflow-hidden rounded-t-3xl"
                style={bannerURL ? { backgroundImage: `url(${bannerURL})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}
            >
                {!bannerURL && (
                    <div className="absolute inset-0 bg-primary-gradient opacity-80" />
                )}

                <label className="absolute top-6 right-6 p-2.5 bg-overlay backdrop-blur-md rounded-xl text-hero transition-all border border-white/10 opacity-0 group-hover:opacity-100 cursor-pointer flex items-center gap-2 text-[10px] font-black uppercase tracking-widest hover:scale-105 active:scale-95">
                    {uploading === 'banner' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Upload className="w-3.5 h-3.5" />}
                    {uploading === 'banner' ? "Processing..." : "Update Banner"}
                    <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'banner')} disabled={!!uploading} />
                </label>
            </div>

            {/* Avatar - Positioned to bridge Banner and Content */}
            <div className="absolute left-10 -bottom-20 z-10 group/avatar">
                <div className="w-40 h-40 rounded-full border-[6px] border-surface bg-surface-alt shadow-float overflow-hidden relative">
                    <img
                        src={photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${displayName || uid}`}
                        className="w-full h-full object-cover group-hover/avatar:scale-110 transition-transform duration-700"
                        alt={displayName}
                    />
                    <label className="absolute inset-0 bg-overlay flex flex-col items-center justify-center opacity-0 group-hover/avatar:opacity-100 transition-opacity cursor-pointer">
                        {uploading === 'avatar' ? <Loader2 className="w-8 h-8 text-hero animate-spin" /> : <Camera className="w-8 h-8 text-hero mb-2" />}
                        <span className="text-[8px] font-black uppercase tracking-widest text-hero">
                            {uploading === 'avatar' ? "Uploading..." : "Update Photo"}
                        </span>
                        <input type="file" className="hidden" accept="image/*" onChange={(e) => handleUpload(e, 'avatar')} disabled={!!uploading} />
                    </label>
                </div>
            </div>
        </div>
    );
}
