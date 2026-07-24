"use client";

import { useState, type FormEvent } from "react";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

export function ContactForm() {
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSubmitted(true);
  }

  if (submitted) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-2xl border border-line bg-card-muted p-10 text-center">
        <CheckCircle2 className="h-10 w-10 text-green-700" />
        <h3 className="text-lg font-bold text-green-950">Message envoyé !</h3>
        <p className="max-w-sm text-sm text-muted">
          Merci de nous avoir contactés. Notre équipe vous répondra dans les plus brefs délais.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <label htmlFor="name" className="text-sm font-semibold text-green-950">
            Nom complet
          </label>
          <input
            id="name"
            name="name"
            type="text"
            required
            placeholder="Votre nom"
            className="rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-green-600"
          />
        </div>
        <div className="flex flex-col gap-2">
          <label htmlFor="email" className="text-sm font-semibold text-green-950">
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            placeholder="vous@entreprise.ma"
            className="rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-green-600"
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="company" className="text-sm font-semibold text-green-950">
          Entreprise <span className="font-normal text-muted">(optionnel)</span>
        </label>
        <input
          id="company"
          name="company"
          type="text"
          placeholder="Nom de votre entreprise"
          className="rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-green-600"
        />
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="message" className="text-sm font-semibold text-green-950">
          Message
        </label>
        <textarea
          id="message"
          name="message"
          required
          rows={5}
          placeholder="Parlez-nous de votre équipe et de vos besoins..."
          className="resize-none rounded-xl border border-line bg-white px-4 py-3 text-sm outline-none transition-colors focus:border-green-600"
        />
      </div>

      <Button type="submit" size="lg" className="w-fit">
        Envoyer le message
      </Button>
    </form>
  );
}
