"use client";

import { useEffect, useState, useTransition } from "react";
import { Loader2, Minus, Plus, Trash2, Utensils } from "@/components/icons";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getRestaurantDishesAction, updateOrderItemsAction, type UpdateOrderItemInput } from "@/lib/admin/actions";
import type { AdminOrder } from "@/lib/data/admin";
import { formatRupees } from "@/lib/format";
import { OFFERS } from "@/lib/offers";
import { formatOrderNumber } from "@/lib/orders/status";
import { toast } from "@/lib/toast/store";

type Props = {
  order: AdminOrder;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onOrderUpdated?: (updatedOrder: AdminOrder) => void;
};

type EditableItem = {
  id?: string;
  dishId?: string | null;
  dishName: string;
  unitPrice: number;
  quantity: number;
  isFree?: boolean;
};

export function EditOrderItemsModal({ order, open, onOpenChange, onOrderUpdated }: Props) {
  // Local state of items being edited
  const [items, setItems] = useState<EditableItem[]>([]);
  const [restaurantDishes, setRestaurantDishes] = useState<{ id: string; name: string; price: number }[]>([]);
  const [loadingDishes, setLoadingDishes] = useState(false);
  const [selectedDishId, setSelectedDishId] = useState<string>("");
  const [isSaving, startSave] = useTransition();

  // Reset editable items whenever modal opens or order changes
  useEffect(() => {
    if (open) {
      setItems(
        order.items.map((i) => ({
          id: i.id,
          dishId: i.dishId ?? null,
          dishName: i.dishName,
          unitPrice: i.unitPrice ?? (i.quantity > 0 ? Math.round(i.subtotal / i.quantity) : 0),
          quantity: i.quantity,
          isFree: i.isFree,
        })),
      );

      // Load restaurant dishes if not yet loaded
      setLoadingDishes(true);
      getRestaurantDishesAction(order.restaurantId)
        .then((dishes) => {
          setRestaurantDishes(dishes);
          if (dishes.length > 0) {
            setSelectedDishId(dishes[0].id);
          }
        })
        .finally(() => setLoadingDishes(false));
    }
  }, [open, order]);

  function updateQuantity(index: number, delta: number) {
    setItems((prev) => {
      const next = [...prev];
      const target = { ...next[index] };
      const newQty = target.quantity + delta;
      if (newQty <= 0) {
        // Remove item
        return next.filter((_, i) => i !== index);
      }
      target.quantity = newQty;
      next[index] = target;
      return next;
    });
  }

  function removeItem(index: number) {
    setItems((prev) => prev.filter((_, i) => i !== index));
  }

  function addSelectedDish() {
    const dish = restaurantDishes.find((d) => d.id === selectedDishId);
    if (!dish) return;

    // If already in list, increase quantity
    const existingIndex = items.findIndex((i) => i.dishId === dish.id || i.dishName.toLowerCase() === dish.name.toLowerCase());
    if (existingIndex >= 0) {
      updateQuantity(existingIndex, 1);
      toast.success(`Increased ${dish.name} quantity.`);
      return;
    }

    // Otherwise add new item
    setItems((prev) => [
      ...prev,
      {
        dishId: dish.id,
        dishName: dish.name,
        unitPrice: dish.price,
        quantity: 1,
        isFree: false,
      },
    ]);
    toast.success(`Added ${dish.name}.`);
  }

  // Calculate live totals
  let itemsSubtotal = 0;
  let freeSubtotal = 0;
  for (const item of items) {
    const sub = item.unitPrice * item.quantity;
    if (item.isFree) {
      freeSubtotal += sub;
    } else {
      itemsSubtotal += sub;
    }
  }

  let discountAmount = 0;
  if (order.discountOffer === "pct10") {
    discountAmount = Math.round(itemsSubtotal * 0.1);
  } else if (order.discountOffer === "pct20") {
    discountAmount = Math.round(itemsSubtotal * 0.2);
  } else if (order.discountOffer === "biryani") {
    discountAmount = freeSubtotal;
  }

  const allSubtotal = itemsSubtotal + freeSubtotal;
  const newTotalAmount = Math.max(0, allSubtotal - discountAmount);

  function handleSave() {
    if (items.length === 0) {
      toast.error("An order must have at least one item. Cancel the order instead if needed.");
      return;
    }

    startSave(async () => {
      const payload: UpdateOrderItemInput[] = items.map((i) => ({
        id: i.id,
        dishId: i.dishId ?? null,
        dishName: i.dishName,
        unitPrice: i.unitPrice,
        quantity: i.quantity,
        isFree: i.isFree,
      }));

      const res = await updateOrderItemsAction(order.id, payload);
      if (res.ok) {
        toast.success("Order items updated successfully.");
        onOpenChange(false);

        // Update local order state in parent card
        if (onOrderUpdated) {
          const updatedItems = items.map((i) => ({
            id: i.id,
            dishId: i.dishId ?? null,
            dishName: i.dishName,
            unitPrice: i.unitPrice,
            quantity: i.quantity,
            subtotal: i.unitPrice * i.quantity,
            isFree: Boolean(i.isFree),
            imageUrl: null,
          }));

          onOrderUpdated({
            ...order,
            items: updatedItems,
            totalAmount: newTotalAmount,
            discountAmount,
          });
        }
      } else {
        toast.error(res.error || "Failed to update order items.");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(next) => (isSaving ? null : onOpenChange(next))}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto p-4 sm:p-6 rounded-2xl sm:rounded-3xl w-[94vw] sm:w-full">
        <DialogHeader className="border-b border-border/60 pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="flex size-8 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <Utensils className="size-4" />
              </span>
              <div>
                <DialogTitle className="font-heading text-lg font-bold text-foreground">
                  Edit Order {formatOrderNumber(order.dailyNumber)}
                </DialogTitle>
                <DialogDescription className="text-xs text-muted-foreground">
                  {order.restaurantName} · {order.studentName}
                </DialogDescription>
              </div>
            </div>
          </div>
        </DialogHeader>

        {/* Current Items List */}
        <div className="mt-4 flex flex-col gap-2.5">
          <div className="flex items-center justify-between text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
            <span>Items & Quantity</span>
            <span>Subtotal</span>
          </div>

          {items.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border/80 p-6 text-center text-xs text-muted-foreground">
              No items in this order. Add at least one item below.
            </div>
          ) : (
            <div className="flex flex-col gap-2 max-h-60 overflow-y-auto pr-1">
              {items.map((item, index) => {
                const sub = item.unitPrice * item.quantity;
                return (
                  <div
                    key={item.id ?? index}
                    className="flex items-center justify-between gap-2 rounded-2xl border border-border/70 bg-secondary/50 p-2.5 sm:p-3"
                  >
                    <div className="min-w-0 flex-1">
                      <p className="font-semibold text-xs sm:text-sm text-foreground truncate">
                        {item.dishName}
                        {item.isFree && (
                          <span className="ml-1.5 rounded-full bg-success-soft px-1.5 py-0.2 text-[10px] font-bold text-success">
                            Free
                          </span>
                        )}
                      </p>
                      <p className="text-[11px] text-muted-foreground">
                        {formatRupees(item.unitPrice)} each
                      </p>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-1.5 shrink-0">
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, -1)}
                        className="flex size-7 items-center justify-center rounded-lg border border-border/80 bg-card text-foreground hover:bg-secondary active:scale-95"
                        aria-label="Decrease quantity"
                      >
                        <Minus className="size-3" />
                      </button>
                      <span className="min-w-6 text-center font-bold text-xs tabular-nums text-foreground">
                        {item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(index, 1)}
                        className="flex size-7 items-center justify-center rounded-lg border border-border/80 bg-card text-foreground hover:bg-secondary active:scale-95"
                        aria-label="Increase quantity"
                      >
                        <Plus className="size-3" />
                      </button>
                    </div>

                    {/* Line Subtotal & Remove */}
                    <div className="flex items-center gap-2 shrink-0 pl-1">
                      <span className="min-w-14 text-right font-bold text-xs sm:text-sm tabular-nums text-foreground">
                        {item.isFree ? "Free" : formatRupees(sub)}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeItem(index)}
                        className="flex size-7 items-center justify-center rounded-lg text-muted-foreground hover:bg-destructive/10 hover:text-destructive active:scale-95 transition"
                        title="Remove dish"
                      >
                        <Trash2 className="size-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Add Item Section */}
        <div className="mt-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-3.5">
          <p className="text-xs font-bold text-foreground">Add dish from {order.restaurantName}</p>
          <div className="mt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
            <select
              value={selectedDishId}
              onChange={(e) => setSelectedDishId(e.target.value)}
              disabled={loadingDishes || restaurantDishes.length === 0}
              className="flex-1 rounded-xl border border-border/80 bg-card px-3 py-2 text-xs font-medium text-foreground outline-none focus:border-primary"
            >
              {loadingDishes ? (
                <option>Loading dishes…</option>
              ) : restaurantDishes.length === 0 ? (
                <option>No dishes found</option>
              ) : (
                restaurantDishes.map((d) => (
                  <option key={d.id} value={d.id}>
                    {d.name} ({formatRupees(d.price)})
                  </option>
                ))
              )}
            </select>

            <button
              type="button"
              onClick={addSelectedDish}
              disabled={loadingDishes || !selectedDishId}
              className="flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 active:scale-95 disabled:opacity-50"
            >
              <Plus className="size-3.5" />
              <span>Add Dish</span>
            </button>
          </div>
        </div>

        {/* Recalculated Order Financials */}
        <div className="mt-4 rounded-2xl bg-secondary/70 p-3.5 space-y-1.5 text-xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span>Items Subtotal</span>
            <span className="font-semibold tabular-nums text-foreground">{formatRupees(itemsSubtotal)}</span>
          </div>

          {order.discountOffer && OFFERS[order.discountOffer] && discountAmount > 0 && (
            <div className="flex items-center justify-between font-semibold text-success">
              <span>{OFFERS[order.discountOffer].short}</span>
              <span className="tabular-nums">−{formatRupees(discountAmount)}</span>
            </div>
          )}

          <div className="flex items-center justify-between border-t border-border/60 pt-2 font-bold text-sm">
            <span className="text-foreground">New Total Amount</span>
            <span className="font-heading text-base font-extrabold text-primary tabular-nums">
              {formatRupees(newTotalAmount)}
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 flex items-center justify-end gap-2 border-t border-border/60 pt-3">
          <button
            type="button"
            disabled={isSaving}
            onClick={() => onOpenChange(false)}
            className="rounded-2xl border border-border/80 px-4 py-2 text-xs font-bold text-muted-foreground hover:text-foreground active:scale-95"
          >
            Cancel
          </button>
          <button
            type="button"
            disabled={isSaving || items.length === 0}
            onClick={handleSave}
            className="flex items-center gap-1.5 rounded-2xl bg-[#FF6B00] px-5 py-2 text-xs font-bold text-white shadow-xs hover:bg-[#e05f00] active:scale-95 disabled:opacity-50"
          >
            {isSaving && <Loader2 className="size-3.5 animate-spin" />}
            <span>Save Changes</span>
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
