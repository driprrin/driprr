"use client";

import { useState, useEffect, useRef } from "react";
import AdminLayout from "@/components/AdminLayout";
import { supabaseAdmin } from "@/lib/supabase";
import { Upload, Loader2, ImagePlus, Check } from "lucide-react";

const CLOUDINARY_CLOUD = "hunu2oxf";
const CLOUDINARY_PRESET = "d1qib0aj";

interface CategoryImg {
  id: string;
  label: string;
  slug: string;
  imageUrl: string;
}

async function uploadToCloudinary(file: File): Promise<string> {
  const fd = new FormData();
  fd.append("file", file);
  fd.append("upload_preset", CLOUDINARY_PRESET);
  fd.append("folder", "driprr/categories");
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD}/image/upload`, { method: "POST", body: fd });
  const data = await res.json();
  if (!data.secure_url) throw new Error("Upload failed");
  return data.secure_url;
}

export default function AdminCategoriesPage() {
  const [categories, setCategories] = useState<CategoryImg[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState<string | null>(null);
  const [saved, setSaved] = useState<string | null>(null);

  useEffect(() => {
    supabaseAdmin.from("CategoryImage").select("*").order("id").then(({ data }) => {
      setCategories(data ?? []);
      setLoading(false);
    });
  }, []);

  async function handleUpload(catId: string, file: File) {
    setUploading(catId);
    try {
      const url = await uploadToCloudinary(file);
      await supabaseAdmin.from("CategoryImage").update({ imageUrl: url, updatedAt: new Date().toISOString() }).eq("id", catId);
      setCategories((prev) => prev.map((c) => c.id === catId ? { ...c, imageUrl: url } : c));
      setSaved(catId);
      setTimeout(() => setSaved(null), 2000);
    } catch { alert("Upload failed"); }
    finally { setUploading(null); }
  }

  return (
    <AdminLayout title="Category Images">
      <p className="text-text-mute text-sm mb-6">Upload or change category images shown on the homepage. Images should be square (1:1 ratio) for best results.</p>

      {loading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 size={24} className="animate-spin text-primary" />
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5">
          {categories.map((cat) => (
            <CategoryCard
              key={cat.id}
              cat={cat}
              uploading={uploading === cat.id}
              saved={saved === cat.id}
              onUpload={(file) => handleUpload(cat.id, file)}
            />
          ))}
        </div>
      )}
    </AdminLayout>
  );
}

function CategoryCard({ cat, uploading, saved, onUpload }: { cat: CategoryImg; uploading: boolean; saved: boolean; onUpload: (file: File) => void }) {
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <div className="bg-surface-1 border border-border-low rounded-2xl overflow-hidden">
      {/* Image */}
      <div className="relative aspect-square bg-surface-2">
        {cat.imageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cat.imageUrl} alt={cat.label} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-mute">
            <ImagePlus size={32} />
          </div>
        )}
        {/* Upload overlay */}
        <button
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 flex items-center justify-center transition-opacity"
        >
          {uploading ? (
            <Loader2 size={24} className="text-white animate-spin" />
          ) : saved ? (
            <Check size={24} className="text-green-400" />
          ) : (
            <Upload size={24} className="text-white" />
          )}
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) onUpload(file);
            if (fileRef.current) fileRef.current.value = "";
          }}
        />
      </div>
      {/* Label */}
      <div className="p-3">
        <p className="font-bold text-sm text-text-primary">{cat.label}</p>
        <p className="text-[10px] text-text-mute">→ /{cat.slug}</p>
      </div>
    </div>
  );
}
