"use client";

import { useState, useTransition } from "react";
import { BlurImage } from "@/components/blur-image";
import { Loader2, PencilSimple, Plus, Storefront, Trash2, X } from "@/components/icons";
import { adminAction, adminPill } from "@/components/admin/styles";
import {
 AlertDialog,
 AlertDialogAction,
 AlertDialogCancel,
 AlertDialogContent,
 AlertDialogDescription,
 AlertDialogFooter,
 AlertDialogHeader,
 AlertDialogTitle,
 AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
 Dialog,
 DialogContent,
 DialogDescription,
 DialogTitle,
 DialogTrigger,
} from "@/components/ui/dialog";
import {
 createRestaurant,
 deleteRestaurant,
 updateRestaurant,
} from "@/lib/admin/actions";
import type { AdminRestaurantFull } from "@/lib/data/admin";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

export function RestaurantsManager({ restaurants }: { restaurants: AdminRestaurantFull[] }) {
 const [editing, setEditing] = useState<AdminRestaurantFull | null>(null);
 const [addOpen, setAddOpen] = useState(false);

 return (
 <div className="flex flex-col gap-4">
 <Dialog open={addOpen} onOpenChange={setAddOpen}>
 <DialogTrigger className={cn(adminAction, "bg-primary text-primary-foreground")}>
 <Plus className="size-4" aria-hidden="true" />
 Add restaurant
 </DialogTrigger>
 <RestaurantForm
 onSubmit={async (data) => {
 const result = await createRestaurant(data);
 if (result.ok) {
 setAddOpen(false);
 toast.success("Restaurant added.");
 } else {
 toast.error(result.error);
 }
 }}
 />
 </Dialog>

 {restaurants.length === 0 ? (
 <p className="text-sm text-muted-foreground">No restaurants yet. Add one to get started.</p>
 ) : (
 <ul className="flex flex-col gap-3">
 {restaurants.map((r) => (
 <li key={r.id}>
 <RestaurantCard
 restaurant={r}
 onEdit={() => setEditing(r)}
 />
 </li>
 ))}
 </ul>
 )}

 <Dialog open={!!editing} onOpenChange={(open) => !open && setEditing(null)}>
 {editing && (
 <RestaurantForm
 initial={editing}
 onSubmit={async (data) => {
 const result = await updateRestaurant(editing.id, data);
 if (result.ok) {
 setEditing(null);
 toast.success("Restaurant updated.");
 } else {
 toast.error(result.error);
 }
 }}
 />
 )}
 </Dialog>
 </div>
 );
}

function RestaurantCard({
 restaurant,
 onEdit,
}: {
 restaurant: AdminRestaurantFull;
 onEdit: () => void;
}) {
 const [pending, startTransition] = useTransition();

 function handleDelete() {
 startTransition(async () => {
 const result = await deleteRestaurant(restaurant.id);
 if (result.ok) {
 toast.success("Restaurant deleted.");
 } else {
 toast.error(result.error);
 }
 });
 }

 return (
 <div className="rounded-2xl border bg-card p-4 shadow-card">
 <div className="flex items-start justify-between gap-3">
 <div className="min-w-0 flex-1">
 <div className="flex items-center gap-2">
 <Storefront className="size-5 text-primary" aria-hidden="true" />
 <h3 className="font-heading text-title font-bold truncate">{restaurant.name}</h3>
 {!restaurant.isActive && (
 <span className="rounded-full bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground">
 Inactive
 </span>
 )}
 </div>
 {restaurant.phone && (
 <p className="mt-1 text-sm text-muted-foreground">{restaurant.phone}</p>
 )}
 {restaurant.description && (
 <p className="mt-2 text-sm">{restaurant.description}</p>
 )}
 <div className="mt-3 flex flex-wrap gap-2">
 {restaurant.cuisineTags.length > 0 && (
 <>
 {restaurant.cuisineTags.map((tag) => (
 <span
 key={tag}
 className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-foreground"
 >
 {tag}
 </span>
 ))}
 </>
 )}
 <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-semibold text-secondary-foreground">
 {restaurant.deliveryMinutes} min
 </span>
 </div>
 </div>
 <div className="flex shrink-0 gap-2">
 <button
 type="button"
 onClick={onEdit}
 className={cn(adminPill, "h-9 px-3 text-xs")}
 >
 <PencilSimple className="size-3.5" aria-hidden="true" />
 Edit
 </button>
 <AlertDialog>
 <AlertDialogTrigger
 disabled={pending}
 className={cn(
 adminPill,
 "h-9 px-3 text-xs border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10",
 )}
 >
 {pending ? <Loader2 className="size-3.5 animate-spin" /> : <Trash2 className="size-3.5" aria-hidden="true" />}
 Delete
 </AlertDialogTrigger>
 <AlertDialogContent>
 <AlertDialogHeader>
 <AlertDialogTitle>Delete {restaurant.name}?</AlertDialogTitle>
 <AlertDialogDescription>
 This can't be undone. If the restaurant has any orders, you'll need to deactivate it instead.
 </AlertDialogDescription>
 </AlertDialogHeader>
 <AlertDialogFooter>
 <AlertDialogCancel>Cancel</AlertDialogCancel>
 <AlertDialogAction
 onClick={handleDelete}
 className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
 >
 Delete
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 </div>
 </div>
 </div>
 );
}

function RestaurantForm({
 initial,
 onSubmit,
}: {
 initial?: AdminRestaurantFull;
 onSubmit: (data: {
 name: string;
 phone?: string;
 description?: string;
 cuisineTags?: string[];
 deliveryMinutes?: number;
 isActive?: boolean;
 coverImageUrl?: string | null;
 }) => Promise<void>;
}) {
 const [pending, startTransition] = useTransition();
 const [name, setName] = useState(initial?.name ?? "");
 const [phone, setPhone] = useState(initial?.phone ?? "");
 const [description, setDescription] = useState(initial?.description ?? "");
 const [cuisineTags, setCuisineTags] = useState(initial?.cuisineTags.join(", ") ?? "");
 const [deliveryMinutes, setDeliveryMinutes] = useState(initial?.deliveryMinutes ?? 40);
 const [isActive, setIsActive] = useState(initial?.isActive ?? true);
 const [coverImageUrl, setCoverImageUrl] = useState(initial?.coverImageUrl ?? null);
 // Extract the storage path from the public URL so replacements can delete the old file.
 // Supabase public URLs: https://<project>.supabase.co/storage/v1/object/public/<bucket>/<path>
 const [coverImagePath, setCoverImagePath] = useState<string | null>(() => {
 if (!initial?.coverImageUrl) return null;
 try {
 const url = new URL(initial.coverImageUrl);
 const match = url.pathname.match(/\/storage\/v1\/object\/public\/[^/]+\/(.+)$/);
 return match ? decodeURIComponent(match[1]) : null;
 } catch {
 return null;
 }
 });
 const [uploading, setUploading] = useState(false);

 async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
 const file = e.target.files?.[0];
 if (!file) return;

 setUploading(true);
 const formData = new FormData();
 formData.append("file", file);
 if (coverImagePath) formData.append("oldPath", coverImagePath);

 try {
 const res = await fetch("/api/upload", { method: "POST", body: formData });
 const data = await res.json();
 if (res.ok) {
 setCoverImageUrl(data.url);
 setCoverImagePath(data.path);
 toast.success("Image uploaded.");
 } else {
 toast.error(data.error || "Upload failed.");
 }
 } catch {
 toast.error("Upload failed. Please try again.");
 } finally {
 setUploading(false);
 }
 }

 function handleSubmit(e: React.FormEvent) {
 e.preventDefault();
 if (!name.trim()) {
 toast.error("Name is required.");
 return;
 }
 startTransition(async () => {
 await onSubmit({
 name: name.trim(),
 phone: phone.trim() || undefined,
 description: description.trim() || undefined,
 cuisineTags: cuisineTags
 .split(",")
 .map((t) => t.trim())
 .filter(Boolean),
 deliveryMinutes: Number(deliveryMinutes) || 40,
 isActive,
 coverImageUrl,
 });
 });
 }

 return (
 <DialogContent>
 <div className="mb-4">
 <DialogTitle>{initial ? "Edit restaurant" : "Add restaurant"}</DialogTitle>
 <DialogDescription>
 {initial ? "Update the restaurant details." : "Add a new partner restaurant."}
 </DialogDescription>
 </div>
 <form onSubmit={handleSubmit} className="flex flex-col gap-4">
 <label className="flex flex-col gap-1.5">
 <span className="text-label font-semibold">Name</span>
 <input
 type="text"
 value={name}
 onChange={(e) => setName(e.target.value)}
 required
 className="h-11 rounded-2xl border bg-card px-4 text-sm shadow-card outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
 />
 </label>
 <label className="flex flex-col gap-1.5">
 <span className="text-label font-semibold">Phone</span>
 <input
 type="text"
 value={phone}
 onChange={(e) => setPhone(e.target.value)}
 placeholder="+91 99899 55833"
 className="h-11 rounded-2xl border bg-card px-4 text-sm shadow-card outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
 />
 </label>
 <label className="flex flex-col gap-1.5">
 <span className="text-label font-semibold">Description</span>
 <textarea
 value={description}
 onChange={(e) => setDescription(e.target.value)}
 rows={3}
 className="rounded-2xl border bg-card px-4 py-3 text-sm shadow-card outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
 />
 </label>
 <label className="flex flex-col gap-1.5">
 <span className="text-label font-semibold">Cuisine tags (comma-separated)</span>
 <input
 type="text"
 value={cuisineTags}
 onChange={(e) => setCuisineTags(e.target.value)}
 placeholder="Biryani, Chinese, Starters"
 className="h-11 rounded-2xl border bg-card px-4 text-sm shadow-card outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
 />
 </label>
 <label className="flex flex-col gap-1.5">
 <span className="text-label font-semibold">Delivery minutes (5–240)</span>
 <input
 type="number"
 value={deliveryMinutes}
 onChange={(e) => setDeliveryMinutes(Number(e.target.value))}
 min={5}
 max={240}
 className="h-11 rounded-2xl border bg-card px-4 text-sm shadow-card outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
 />
 </label>
 <label className="flex items-center gap-3">
 <input
 type="checkbox"
 checked={isActive}
 onChange={(e) => setIsActive(e.target.checked)}
 className="size-4 rounded border bg-card"
 />
 <span className="text-sm font-semibold">Active (visible to students)</span>
 </label>

 <div className="flex flex-col gap-1.5">
 <span className="text-label font-semibold">Cover image</span>
 {coverImageUrl && (
 <div className="relative h-32 overflow-hidden rounded-xl border bg-secondary">
 <BlurImage
 src={coverImageUrl}
 alt="Cover preview"
 sizes="256px"
 className="h-full w-full object-cover"
 onError={() => setCoverImageUrl(null)}
 />
 <button
 type="button"
 onClick={() => setCoverImageUrl(null)}
 className="absolute top-2 right-2 flex size-7 items-center justify-center rounded-full bg-black/60 text-white hover:bg-black/80"
 aria-label="Remove cover image"
 >
 <X className="size-4" />
 </button>
 </div>
 )}
 <label className="flex h-11 cursor-pointer items-center justify-center gap-2 rounded-2xl border border-dashed border-ring/30 bg-card px-4 text-sm text-muted-foreground hover:border-ring/60 hover:text-foreground">
 {uploading ? (
 <>
 <Loader2 className="size-4 animate-spin" />
 Uploading...
 </>
 ) : (
 <>
 <Plus className="size-4" />
 {coverImageUrl ? "Change image" : "Upload image"}
 </>
 )}
 <input
 type="file"
 accept="image/png,image/jpeg,image/webp"
 onChange={handleFileUpload}
 disabled={uploading}
 className="sr-only"
 />
 </label>
 </div>

 <div className="mt-2 flex justify-end">
 <button
 type="submit"
 disabled={pending}
 className={cn(adminAction, "bg-primary text-primary-foreground")}
 >
 {pending && <Loader2 className="size-4 animate-spin" />}
 {initial ? "Save changes" : "Add restaurant"}
 </button>
 </div>
 </form>
 </DialogContent>
 );
}