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
        <Button className="cart-trigger" aria-label={`Sepet, ${cart.itemCount} ürün`}>
          <ShoppingBag aria-hidden="true" />
          <span>Sepet</span>
          <strong>{cart.itemCount}</strong>
        </Button>
      </SheetTrigger>
      <SheetContent className="cart-sheet" aria-describedby="cart-description">
        <SheetHeader className="cart-sheet__header">
          <SheetTitle>Sepetiniz</SheetTitle>
          <SheetDescription id="cart-description">
            En iyi uygun kampanya otomatik olarak uygulanır.
          </SheetDescription>
        </SheetHeader>

        {cart.lines.length === 0 ? (
          <div className="cart-empty">
            <ShoppingBag aria-hidden="true" />
            <h3>Sepetiniz keşfe hazır</h3>
            <p>Bakım rutininize uygun bir ürün ekleyerek başlayın.</p>
          </div>
        ) : (
          <div className="cart-lines">
            {cart.lines.map(({ product, quantity }) => (
              <article className="cart-line" key={product.id}>
                <div className="cart-line__swatch" style={{ background: product.accent }} />
                <div>
                  <strong>{product.shortName}</strong>
                  <span>{product.size}</span>
                  <div className="quantity-control" aria-label={`${product.shortName} adedi`}>
                    <button onClick={() => cart.decrease(product.id)} aria-label="Bir azalt">
                      <Minus aria-hidden="true" />
                    </button>
                    <output>{quantity}</output>
                    <button onClick={() => cart.add(product)} aria-label="Bir artır">
                      <Plus aria-hidden="true" />
                    </button>
                  </div>
                </div>
                <div className="cart-line__price">
                  <strong>{formatPrice(product.price * quantity)}</strong>
                  <button onClick={() => cart.remove(product.id)} aria-label={`${product.shortName} ürününü sil`}>
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
                <span>Toplam</span>
                <strong>{formatPrice(cart.total)}</strong>
              </div>
              <Button className="checkout-button" disabled>
                Güvenli ödeme yakında
              </Button>
              <button className="clear-cart" onClick={cart.clear}>Sepeti temizle</button>
            </>
          )}
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
