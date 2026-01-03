import ReactMarkdown from "react-markdown";
import InfoPageLayout from "@/components/Layout/InfoPageLayout";
import { SEO } from "@/components/SEO";

const PrivacyPolicy = () => {
  const content = {
    title: "Privacy Policy",
    content: `
# 🦎 Polityka Prywatności - IguanaFlow

Ostatnia aktualizacja: 13.07.2025

---

## Kto jest administratorem danych?

Administratorem Twoich danych osobowych jest:  
Joanna Kokot Usługi Informatyczne                     
NIP: PL9161389290                   
E-mail: 📧 [hello@iguanaflow.com](mailto:hello@iguanaflow.com)

---

## Jakie dane zbieramy?

Zbieramy tylko dane niezbędne do prawidłowego działania IguanaFlow:
- Twój adres e-mail (do logowania, powiadomień, kontaktu),
- zdjęcia i filmy pozycji dodawane przez użytkowników,
- informacje o Twojej aktywności w aplikacji (zapisane pozycje, obserwowani znajomi).

---

##  Po co przetwarzamy Twoje dane?

Wykorzystujemy Twoje dane, aby:
- tworzyć i zarządzać Twoim kontem,
- udostępniać funkcje społecznościowe,
- ulepszać zawartość i funkcjonalność aplikacji,
- kontaktować się z Tobą w sprawach technicznych lub serwisowych.

---

## Komu udostępniamy dane?

Nie sprzedajemy Twoich danych.  
Możemy je udostępnić tylko:
- dostawcom usług technicznych (np. hosting, płatności Stripe),
- jeśli jest to wymagane prawem.

---

## Jak długo przechowujemy Twoje dane?

Przechowujemy Twoje dane tak długo, jak korzystasz z IguanaFlow.  
Jeśli usuniesz swoje konto - usuniemy Twoje dane z wyjątkiem przypadków, gdy musimy je zachować ze względów prawnych.

---

## Twoje prawa

Masz prawo do:
- dostępu do swoich danych,
- ich poprawiania,
- usunięcia,
- ograniczenia przetwarzania,
- przeniesienia swoich danych,
- złożenia skargi do lokalnego organu ochrony danych (np. w UE: RODO).

---

## Kontakt

Masz pytania? Skontaktuj się z nami:  
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
        title="Polityka Prywatności"
        description="Dowiedz się jak IguanaFlow chroni Twoje dane osobowe. Przeczytaj naszą politykę prywatności i poznaj swoje prawa."
        url="https://iguanaflow.app/privacy-policy"
      />
      <InfoPageLayout>
        {renderMarkdown(content.content)}
      </InfoPageLayout>
    </>
  );
};

export default PrivacyPolicy;
