"use client";

import { useMemo, useState, useTransition, type ReactNode } from "react";
import {
 ChevronDown,
 ChevronRight,
 Leaf,
 Loader2,
 PencilSimple,
 Plus,
 Trash2,
} from "@/components/icons";
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
import { VegMark } from "@/components/veg-mark";
import {
 createCategory,
 createDish,
 deleteCategory,
 deleteDish,
 updateCategory,
 updateDish,
} from "@/lib/admin/actions";
import type { AdminMenuCategory, AdminMenuData, AdminMenuDish } from "@/lib/data/admin";
import { formatRupees } from "@/lib/format";
import { toast } from "@/lib/toast/store";
import { cn } from "@/lib/utils";

/**
 * The Menu page's manager: restaurant tabs at top, then collapsible category
 * sections with dish rows. Each category and dish has add / edit / delete.
 * Changes revalidate the student-facing menus immediately.
 */
export function MenuManager({ data }: { data: AdminMenuData }) {
 const [activeRestaurant, setActiveRestaurant] = useState(
 data.restaurants[0]?.id ?? "",
 );
 const categories = data.menus[activeRestaurant] ?? [];

 return (
 <div className="flex flex-col gap-4">
 <div className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none]">
 {data.restaurants.map((r) => (
 <Tab
 key={r.id}
 active={r.id === activeRestaurant}
 onClick={() => setActiveRestaurant(r.id)}
 >
 {r.name}
 </Tab>
 ))}
 </div>

 {data.restaurants.length === 0 ? (
 <p className="text-sm text-muted-foreground">
 No restaurants yet. Add one from the Restaurants page first.
 </p>
 ) : (
 <>
 <AddCategoryButton restaurantId={activeRestaurant} />
 {categories.length === 0 ? (
 <p className="text-sm text-muted-foreground">
 No categories yet. Add one to start building the menu.
 </p>
 ) : (
 <ul className="flex flex-col gap-4">
 {categories.map((cat) => (
 <li key={cat.id}>
 <CategorySection
 category={cat}
 restaurantId={activeRestaurant}
 allCategories={categories}
 />
 </li>
 ))}
 </ul>
 )}
 </>
 )}
 </div>
 );
}

function Tab({
 active,
 onClick,
 children,
}: {
 active: boolean;
 onClick: () => void;
 children: ReactNode;
}) {
 return (
 <button
 type="button"
 onClick={onClick}
 aria-pressed={active}
 className={cn(
 "h-10 shrink-0 rounded-full px-4 text-sm font-semibold whitespace-nowrap outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/80",
 active
 ? "bg-primary text-primary-foreground"
 : "bg-secondary text-secondary-foreground hover:bg-border",
 )}
 >
 {children}
 </button>
 );
}

function AddCategoryButton({ restaurantId }: { restaurantId: string }) {
 const [open, setOpen] = useState(false);
 const [name, setName] = useState("");
 const [pending, startTransition] = useTransition();

 function handleSubmit(e: React.FormEvent) {
 e.preventDefault();
 if (!name.trim()) {
 toast.error("Category name is required.");
 return;
 }
 startTransition(async () => {
 const result = await createCategory(restaurantId, name.trim());
 if (result.ok) {
 setOpen(false);
 setName("");
 toast.success("Category added.");
 } else {
 toast.error(result.error);
 }
 });
 }

 return (
 <Dialog open={open} onOpenChange={setOpen}>
 <DialogTrigger className={cn(adminPill, "self-start")}>
 <Plus className="size-4" aria-hidden="true" />
 Add category
 </DialogTrigger>
 <DialogContent>
 <div className="mb-4">
 <DialogTitle>Add category</DialogTitle>
 <DialogDescription>
 Create a new menu section for this restaurant.
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
 placeholder="e.g. Biryani, Starters, Desserts"
 className="h-11 rounded-2xl border bg-card px-4 text-sm shadow-card outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
 />
 </label>
 <div className="mt-2 flex justify-end">
 <button
 type="submit"
 disabled={pending}
 className={cn(adminAction, "bg-primary text-primary-foreground")}
 >
 {pending && <Loader2 className="size-4 animate-spin" />}
 Add category
 </button>
 </div>
 </form>
 </DialogContent>
 </Dialog>
 );
}

function CategorySection({
 category,
 restaurantId,
 allCategories,
}: {
 category: AdminMenuCategory;
 restaurantId: string;
 allCategories: AdminMenuCategory[];
}) {
 const [expanded, setExpanded] = useState(true);
 const [editingName, setEditingName] = useState(false);
 const [nameDraft, setNameDraft] = useState(category.name);
 const [namePending, startNameTransition] = useTransition();

 function saveName() {
 if (!nameDraft.trim() || nameDraft.trim() === category.name) {
 setEditingName(false);
 setNameDraft(category.name);
 return;
 }
 startNameTransition(async () => {
 const result = await updateCategory(category.id, nameDraft.trim());
 if (result.ok) {
 setEditingName(false);
 toast.success("Category renamed.");
 } else {
 toast.error(result.error);
 setNameDraft(category.name);
 }
 });
 }

 return (
 <div className="rounded-2xl border bg-card shadow-card">
 <div className="flex items-center gap-2 p-4 pb-2">
 <button
 type="button"
 onClick={() => setExpanded((v) => !v)}
 className="flex size-8 shrink-0 items-center justify-center rounded-full outline-none hover:bg-secondary focus-visible:ring-3 focus-visible:ring-ring/80"
 aria-label={expanded ? "Collapse" : "Expand"}
 >
 {expanded ? (
 <ChevronDown className="size-4" aria-hidden="true" />
 ) : (
 <ChevronRight className="size-4" aria-hidden="true" />
 )}
 </button>
 {editingName ? (
 <input
 type="text"
 value={nameDraft}
 onChange={(e) => setNameDraft(e.target.value)}
 onBlur={saveName}
 onKeyDown={(e) => {
 if (e.key === "Enter") saveName();
 if (e.key === "Escape") {
 setEditingName(false);
 setNameDraft(category.name);
 }
 }}
 autoFocus
 disabled={namePending}
 className="h-8 flex-1 rounded-lg border bg-card px-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
 />
 ) : (
 <h3 className="flex-1 font-heading text-title font-bold truncate">
 {category.name}
 </h3>
 )}
 <span className="shrink-0 rounded-full bg-secondary px-2 py-0.5 text-xs font-semibold text-secondary-foreground">
 {category.dishes.length}
 </span>
 <button
 type="button"
 onClick={() => {
 setEditingName(true);
 setNameDraft(category.name);
 }}
 className={cn(adminPill, "h-8 px-2.5 text-xs")}
 >
 <PencilSimple className="size-3" aria-hidden="true" />
 Rename
 </button>
 <DeleteCategoryButton category={category} />
 </div>

 {expanded && (
 <div className="flex flex-col gap-2 px-4 pb-4">
 {category.dishes.map((dish) => (
 <DishRow
 key={dish.id}
 dish={dish}
 allCategories={allCategories}
 />
 ))}
 <AddDishButton
 restaurantId={restaurantId}
 categoryId={category.id}
 allCategories={allCategories}
 />
 </div>
 )}
 </div>
 );
}

function DeleteCategoryButton({
 category,
}: {
 category: AdminMenuCategory;
}) {
 const [pending, startTransition] = useTransition();

 function handleDelete() {
 startTransition(async () => {
 const result = await deleteCategory(category.id);
 if (result.ok) {
 toast.success("Category deleted.");
 } else {
 toast.error(result.error);
 }
 });
 }

 return (
 <AlertDialog>
 <AlertDialogTrigger
 disabled={pending}
 className={cn(
 adminPill,
 "h-8 px-2.5 text-xs border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10",
 )}
 >
 {pending ? (
 <Loader2 className="size-3 animate-spin" />
 ) : (
 <Trash2 className="size-3" aria-hidden="true" />
 )}
 Delete
 </AlertDialogTrigger>
 <AlertDialogContent>
 <AlertDialogHeader>
 <AlertDialogTitle>Delete "{category.name}"?</AlertDialogTitle>
 <AlertDialogDescription>
 {category.dishes.length > 0
 ? `This category has ${category.dishes.length} dish(es). Delete or move them first.`
 : "This can't be undone."}
 </AlertDialogDescription>
 </AlertDialogHeader>
 <AlertDialogFooter>
 <AlertDialogCancel>Cancel</AlertDialogCancel>
 <AlertDialogAction
 onClick={handleDelete}
 disabled={category.dishes.length > 0}
 className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
 >
 Delete
 </AlertDialogAction>
 </AlertDialogFooter>
 </AlertDialogContent>
 </AlertDialog>
 );
}

function DishRow({
 dish,
 allCategories,
}: {
 dish: AdminMenuDish;
 allCategories: AdminMenuCategory[];
}) {
 const [editOpen, setEditOpen] = useState(false);

 return (
 <div className="flex items-center gap-3 rounded-xl border bg-card/50 p-2.5 pr-3">
 <VegMark isVeg={dish.isVeg} className="size-4 shrink-0" />
 <div className="min-w-0 flex-1">
 <p className="flex items-center gap-1.5 font-semibold text-sm">
 <span className="truncate">{dish.name}</span>
 {!dish.isAvailable && (
 <span className="rounded-full bg-destructive/10 px-1.5 py-0.5 text-[10px] font-bold text-destructive">
 Sold out
 </span>
 )}
 </p>
 <p className="mt-0.5 text-xs text-muted-foreground">
 {formatRupees(dish.price)}
 {dish.note && <span className="ml-1.5">· {dish.note}</span>}
 </p>
 </div>
 <button
 type="button"
 onClick={() => setEditOpen(true)}
 className={cn(adminPill, "h-8 px-2.5 text-xs")}
 >
 <PencilSimple className="size-3" aria-hidden="true" />
 Edit
 </button>
 <DeleteDishButton dish={dish} />

 <Dialog open={editOpen} onOpenChange={setEditOpen}>
 <DishForm
 dish={dish}
 allCategories={allCategories}
 onSubmit={async (formData) => {
 const result = await updateDish(dish.id, formData);
 if (result.ok) {
 setEditOpen(false);
 toast.success("Dish updated.");
 } else {
 toast.error(result.error);
 }
 }}
 />
 </Dialog>
 </div>
 );
}

function DeleteDishButton({ dish }: { dish: AdminMenuDish }) {
 const [pending, startTransition] = useTransition();

 function handleDelete() {
 startTransition(async () => {
 const result = await deleteDish(dish.id);
 if (result.ok) {
 toast.success("Dish deleted.");
 } else {
 toast.error(result.error);
 }
 });
 }

 return (
 <AlertDialog>
 <AlertDialogTrigger
 disabled={pending}
 className={cn(
 adminPill,
 "h-8 px-2.5 text-xs border-destructive/30 bg-destructive/5 text-destructive hover:bg-destructive/10",
 )}
 >
 {pending ? (
 <Loader2 className="size-3 animate-spin" />
 ) : (
 <Trash2 className="size-3" aria-hidden="true" />
 )}
 </AlertDialogTrigger>
 <AlertDialogContent>
 <AlertDialogHeader>
 <AlertDialogTitle>Delete "{dish.name}"?</AlertDialogTitle>
 <AlertDialogDescription>
 If this dish appears in any order history, it can't be deleted.
 Mark it as sold out instead.
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
 );
}

function AddDishButton({
 restaurantId,
 categoryId,
 allCategories,
}: {
 restaurantId: string;
 categoryId: string;
 allCategories: AdminMenuCategory[];
}) {
 const [open, setOpen] = useState(false);

 return (
 <Dialog open={open} onOpenChange={setOpen}>
 <DialogTrigger
 className={cn(
 "flex h-9 w-full items-center justify-center gap-1.5 rounded-xl border border-dashed border-ring/30 text-xs font-semibold text-muted-foreground outline-none hover:border-ring/60 hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/80",
 )}
 >
 <Plus className="size-3.5" aria-hidden="true" />
 Add dish
 </DialogTrigger>
 <DishForm
 restaurantId={restaurantId}
 categoryId={categoryId}
 allCategories={allCategories}
 onSubmit={async (data) => {
 const result = await createDish(data);
 if (result.ok) {
 setOpen(false);
 toast.success("Dish added.");
 } else {
 toast.error(result.error);
 }
 }}
 />
 </Dialog>
 );
}

function DishForm({
 dish,
 restaurantId,
 categoryId,
 allCategories,
 onSubmit,
}: {
 dish?: AdminMenuDish;
 restaurantId?: string;
 categoryId?: string;
 allCategories: AdminMenuCategory[];
 onSubmit: (data: {
 restaurantId: string;
 name: string;
 price: number;
 isVeg: boolean;
 categoryId?: string | null;
 note?: string;
 }) => Promise<void>;
}) {
 const [pending, startTransition] = useTransition();
 const [name, setName] = useState(dish?.name ?? "");
 const [price, setPrice] = useState(dish?.price ?? 0);
 const [isVeg, setIsVeg] = useState(dish?.isVeg ?? true);
 const [note, setNote] = useState(dish?.note ?? "");
 const [selectedCategory, setSelectedCategory] = useState(
 dish?.categoryId ?? categoryId ?? "",
 );

 const effectiveRestaurantId = dish?.restaurantId ?? restaurantId ?? "";

 function handleSubmit(e: React.FormEvent) {
 e.preventDefault();
 if (!name.trim()) {
 toast.error("Dish name is required.");
 return;
 }
 if (price <= 0) {
 toast.error("Price must be greater than zero.");
 return;
 }
 startTransition(async () => {
 await onSubmit({
 restaurantId: effectiveRestaurantId,
 name: name.trim(),
 price: Math.round(price),
 isVeg,
 categoryId: selectedCategory || null,
 note: note.trim() || undefined,
 });
 });
 }

 return (
 <DialogContent>
 <div className="mb-4">
 <DialogTitle>{dish ? "Edit dish" : "Add dish"}</DialogTitle>
 <DialogDescription>
 {dish ? "Update the dish details." : "Add a new dish to this category."}
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
 <div className="flex gap-3">
 <label className="flex flex-col gap-1.5 flex-1">
 <span className="text-label font-semibold">Price (₹)</span>
 <input
 type="number"
 value={price}
 onChange={(e) => setPrice(Number(e.target.value))}
 min={1}
 required
 className="h-11 rounded-2xl border bg-card px-4 text-sm shadow-card outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
 />
 </label>
 <label className="flex items-end gap-2 pb-1">
 <input
 type="checkbox"
 checked={isVeg}
 onChange={(e) => setIsVeg(e.target.checked)}
 className="size-4 rounded border bg-card"
 />
 <span className="flex items-center gap-1.5 text-sm font-semibold">
 <Leaf className="size-3.5 text-success" aria-hidden="true" />
 Veg
 </span>
 </label>
 </div>
 <label className="flex flex-col gap-1.5">
 <span className="text-label font-semibold">Category</span>
 <select
 value={selectedCategory}
 onChange={(e) => setSelectedCategory(e.target.value)}
 className="h-11 rounded-2xl border bg-card px-4 text-sm shadow-card outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
 >
 <option value="">No category</option>
 {allCategories.map((c) => (
 <option key={c.id} value={c.id}>
 {c.name}
 </option>
 ))}
 </select>
 </label>
 <label className="flex flex-col gap-1.5">
 <span className="text-label font-semibold">Note (optional)</span>
 <input
 type="text"
 value={note}
 onChange={(e) => setNote(e.target.value)}
 placeholder="e.g. Thursday Only, Spicy, 6 pcs"
 className="h-11 rounded-2xl border bg-card px-4 text-sm shadow-card outline-none focus-visible:ring-3 focus-visible:ring-ring/40"
 />
 </label>
 <div className="mt-2 flex justify-end">
 <button
 type="submit"
 disabled={pending}
 className={cn(adminAction, "bg-primary text-primary-foreground")}
 >
 {pending && <Loader2 className="size-4 animate-spin" />}
 {dish ? "Save changes" : "Add dish"}
 </button>
 </div>
 </form>
 </DialogContent>
 );
}