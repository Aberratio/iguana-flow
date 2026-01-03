import ReactMarkdown from "react-markdown";
import InfoPageLayout from "@/components/Layout/InfoPageLayout";
import { SEO } from "@/components/SEO";

const AboutUs = () => {
  const content = {
    title: "O nas",
    content: `
# 🦎 O IguanaFlow

Witaj w **IguanaFlow** - rozwijającej się społeczności i platformie dla artystów powietrznych, tancerzy pole dance i wszystkich, którzy kochają latać.

---

## Nasza misja

Wierzymy, że sztuki powietrzne są dla każdego - niezależnie od tego, czy dopiero uczysz się pierwszej figury, czy opanowujesz zaawansowane kombinacje.  
**IguanaFlow** pomoże Ci:

- Poznać starannie wyselekcjonowaną bibliotekę pozycji, trików i przejść.
- Znaleźć inspirację do treningów.
- Połączyć się z innymi powietrznikami z całego świata.
- Podejmować wyzwania i świętować swoje postępy.
- Odkryć swój flow - w dowolnym czasie i miejscu.

---

## Co tu znajdziesz

- **Bibliotekę ruchów:** Wyraźne zdjęcia, krótkie dema wideo, wskazówki i wariacje.
- **Feed i społeczność:** Dziel się swoimi postępami, pytaj o porady, kibicuj innym.
- **Znajomi i obserwowani:** Buduj swoją sieć powietrzną - trenujcie razem, inspirujcie się.
- **Odznaki i wyzwania:** Urozmaić swoją podróż, osiągać kamienie milowe, utrzymywać motywację.
- **Przyszłe kursy:** Wkrótce znajdziesz pełne programy treningowe stworzone przez prawdziwych instruktorów powietrznych.

---

## Dlaczego Iguana?

**Iguana** to jeden z naszych ulubionych ruchów - ale to także symbol: spokojny, silny, adaptacyjny, zawsze gotowy wspiąć się wyżej. Tak jak Ty.

---

## Dołącz do flow

Dopiero zaczynamy - a Ty możesz pomóc kształtować tę przestrzeń!  
Dodawaj figury, dziel się pomysłami, zostań wczesnym testerem lub twórcą kursu.

Razem uczynimy wiedzę o sztukach powietrznych bardziej dostępną, zabawną i zorganizowaną - dla każdego ucznia i każdego nauczyciela.

---

## Skontaktuj się

Masz uwagi, pomysły lub pytania?  
Napisz do nas na Instagramie [@iguana.flow](https://www.instagram.com/iguana.flow)  
lub wyślij e-mail na [hello@iguanaflow.com](mailto:hello@iguanaflow.com).
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
        title="O Nas"
        description="Poznaj zespół IguanaFlow i naszą misję wspierania sportowców aerial. Dołącz do społeczności pole dance i aerial hoop!"
        url="https://iguanaflow.app/about-us"
      />
      <InfoPageLayout>
        {renderMarkdown(content.content)}
      </InfoPageLayout>
    </>
  );
};

export default AboutUs;
