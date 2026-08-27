"use client";

import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { formatPrice } from "@/features/catalog/products";
import { useCart } from "./cart-context";

export function CartSheet() {
  const cart = useCart();

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button className="cart-trigger" aria-label={`Cart, ${cart.itemCount} items`}>
          <ShoppingBag aria-hidden="true" />
          <span>Lorem</span>
          <strong>{cart.itemCount}</strong>
        </Button>
      </SheetTrigger>
      <SheetContent className="cart-sheet" aria-describedby="cart-description">
        <SheetHeader className="cart-sheet__header">
          <SheetTitle>Lorem ipsum</SheetTitle>
          <SheetDescription id="cart-description">
            Dolor sit amet, consectetur adipiscing elit.
          </SheetDescription>
        </SheetHeader>

        {cart.lines.length === 0 ? (
          <div className="cart-empty">
            <ShoppingBag aria-hidden="true" />
            <h3>Lorem ipsum dolor sit amet</h3>
            <p>Consectetur adipiscing elit, sed do eiusmod tempor.</p>
          </div>
        ) : (
          <div className="cart-lines">
            {cart.lines.map(({ product, quantity }) => (
              <article className="cart-line" key={product.id}>
                <div className="cart-line__swatch" style={{ background: product.accent }} />
                <div>
                  <strong>{product.shortName}</strong>
                  <span>{product.size}</span>
                  <div className="quantity-control" aria-label={`${product.shortName} quantity`}>
                    <button onClick={() => cart.decrease(product.id)} aria-label="Decrease quantity">
                      <Minus aria-hidden="true" />
                    </button>
                    <output>{quantity}</output>
                    <button onClick={() => cart.add(product)} aria-label="Increase quantity">
                      <Plus aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="cart-line__price">
                  <strong>{formatPrice(product.price * quantity)}</strong>
                  <button onClick={() => cart.remove(product.id)} aria-label={`Remove ${product.shortName}`}>
                    <Trash2 aria-hidden="true" />
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}

        <SheetFooter className="cart-sheet__footer">
          {cart.lines.length > 0 && (
            <>
              <div className="discount-row">
                <span>{cart.campaign.name}</span>
                <strong>−{formatPrice(cart.campaign.discount)}</strong>
              </div>
              <p className="discount-note">{cart.campaign.message}</p>
              <div className="total-row">
                <span>Lorem ipsum</span>
                <strong>{formatPrice(cart.total)}</strong>
              </div>
              <Button className="checkout-button" disabled>
                Dolor sit amet
              </Button>
              <button className="clear-cart" onClick={cart.clear}>Consectetur elit</button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
