// Un solo avviso alla volta, con un'azione facoltativa (di solito "Annulla").
// Un avviso nuovo sostituisce il precedente: l'azione vale sempre per l'ultimo.
export interface ToastAction {
  label: string;
  run: () => void | Promise<void>;
}

class ToastState {
  message = $state<string | null>(null);
  action = $state<ToastAction | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;

  show(message: string, action?: ToastAction, ms = 5000) {
    this.message = message;
    this.action = action ?? null;
    clearTimeout(this.timer);
    this.timer = setTimeout(() => this.dismiss(), ms);
  }

  dismiss() {
    clearTimeout(this.timer);
    this.message = null;
    this.action = null;
  }

  async runAction() {
    const a = this.action;
    this.dismiss();
    await a?.run();
  }
}

export const toast = new ToastState();
