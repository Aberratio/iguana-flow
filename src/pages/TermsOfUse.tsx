import ReactMarkdown from "react-markdown";
import InfoPageLayout from "@/components/Layout/InfoPageLayout";
import SEO from "@/components/SEO";

const TermsOfUse = () => {
  const content = {
    title: "Terms of Use",
    content: `
# 🦎 Regulamin - IguanaFlow

Ostatnia aktualizacja: 13.07.2025

---

## Postanowienia ogólne

1. Niniejszy Regulamin określa zasady korzystania z aplikacji IguanaFlow dostępnej pod adresem **[iguanaflow.com](https://iguanaflow.com)**.
2. Aplikacja prowadzona jest przez:  
   Joanna Kokot Usługi Informatyczne                           
   NIP: PL9161389290                     
   E-mail kontaktowy: 📧 [hello@iguanaflow.com](mailto:hello@iguanaflow.com)

---

## Warunki korzystania

1. Korzystanie z aplikacji wymaga założenia konta.
2. Użytkownicy muszą podawać prawdziwe i dokładne informacje.
3. Zabronione jest publikowanie treści niezgodnych z prawem, obraźliwych lub naruszających prawa osób trzecich.
4. Administrator może zablokować konto w przypadku naruszenia Regulaminu.

---

## Własność intelektualna

1. Wszystkie treści w aplikacji (zdjęcia, filmy, opisy) są chronione prawem autorskim.
2. Kopiowanie, rozpowszechnianie lub wykorzystywanie treści bez zgody jest zabronione.
3. Treści dodawane przez użytkowników pozostają ich własnością, ale użytkownicy udzielają licencji na ich wyświetlanie w ramach aplikacji.

---

## Płatności

1. Niektóre funkcje IguanaFlow mogą być płatne.
2. Płatności obsługiwane są przez Stripe.
3. Brak opłaty za subskrypcję lub kurs może ograniczyć dostęp do płatnych treści.

---

## Odpowiedzialność

1. Administrator nie ponosi odpowiedzialności za treści dodawane przez użytkowników.
2. Użytkownicy korzystają z aplikacji na własne ryzyko i powinni zawsze ćwiczyć bezpiecznie.

---

## Zmiany w Regulaminie

1. Administrator zastrzega sobie prawo do zmiany Regulaminu.
2. Użytkownicy zostaną poinformowani o zmianach e-mailem lub za pośrednictwem aplikacji.

---

## Kontakt

Pytania? Skontaktuj się z nami:  
📧 [hello@iguanaflow.com](mailto:hello@iguanaflow.com)
`,
  };

  const renderMarkdown = (content: string) => {
    return (
      <div className="prose prose-invert max-w-none">
        <ReactMarkdown
          components={{
            h1: ({ children }) => (
              <h1 className="text-3xl font-bold text-white mb-6 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                {children}
              </h1>
            ),
            h2: ({ children }) => (
              <h2 className="text-2xl font-semibold mb-4 mt-8 bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent">
                {children}
              </h2>
            ),
            h3: ({ children }) => (
              <h3 className="text-lg font-semibold text-white mb-3">
                {children}
              </h3>
            ),
            p: ({ children }) => (
              <p className="text-muted-foreground mb-4">{children}</p>
            ),
            ul: ({ children }) => (
              <ul className="list-disc pl-6 space-y-2 text-muted-foreground mb-4">
                {children}
              </ul>
            ),
            ol: ({ children }) => (
              <ol className="list-decimal pl-6 space-y-2 text-muted-foreground mb-4">
                {children}
              </ol>
            ),
            li: ({ children }) => (
              <li className="text-muted-foreground">{children}</li>
            ),
            strong: ({ children }) => (
              <strong className="text-white font-semibold">{children}</strong>
            ),
            em: ({ children }) => <em className="text-primary">{children}</em>,
            code: ({ children }) => (
              <code className="bg-white/10 text-primary px-1 py-0.5 rounded text-sm">
                {children}
              </code>
            ),
            pre: ({ children }) => (
              <pre className="bg-white/10 p-4 rounded-lg overflow-x-auto mb-4">
                {children}
              </pre>
            ),
            blockquote: ({ children }) => (
              <blockquote className="border-l-4 border-primary pl-4 italic text-muted-foreground mb-4">
                {children}
              </blockquote>
            ),
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
    );
  };

  return (
    <>
      <SEO
        title="Regulamin"
        description="Zasady korzystania z platformy IguanaFlow. Przeczytaj regulamin przed rozpoczęciem treningów."
        url="https://iguanaflow.app/terms-of-use"
      />
      <InfoPageLayout>
        {renderMarkdown(content.content)}
      </InfoPageLayout>
    </>
  );
};

export default TermsOfUse;
