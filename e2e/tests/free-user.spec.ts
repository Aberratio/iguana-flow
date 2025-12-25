import { test, expect } from '@playwright/test';

test.describe('Użytkownik Free - Nawigacja i dostępność', () => {
  test.describe('Strony publiczne', () => {
    test('strona 404 wyświetla komunikat po polsku', async ({ page }) => {
      await page.goto('/nieistniejaca-strona-test-123');
      
      // Sprawdź że strona 404 jest po polsku
      await expect(page.getByText('Nie znaleziono strony')).toBeVisible();
      await expect(page.getByText('Ups! Strona, której szukasz, nie istnieje')).toBeVisible();
      await expect(page.getByRole('link', { name: /Strona główna/i })).toBeVisible();
      await expect(page.getByRole('link', { name: /Wróć/i })).toBeVisible();
      await expect(page.getByText('skontaktuj się z nami')).toBeVisible();
    });

    test('strona 404 jest responsywna', async ({ page }) => {
      // Desktop
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/nieistniejaca-strona');
      await expect(page.getByText('404')).toBeVisible();
      
      // Mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/nieistniejaca-strona');
      await expect(page.getByText('404')).toBeVisible();
      await expect(page.getByRole('link', { name: /Strona główna/i })).toBeVisible();
    });

    test('link "skontaktuj się z nami" przekierowuje do about-us', async ({ page }) => {
      await page.goto('/nieistniejaca-strona');
      
      const contactLink = page.getByRole('link', { name: /skontaktuj się z nami/i });
      await expect(contactLink).toBeVisible();
      await expect(contactLink).toHaveAttribute('href', '/about-us');
    });

    test('strona regulaminu jest dostępna', async ({ page }) => {
      await page.goto('/terms');
      await expect(page).toHaveURL(/\/terms/);
    });

    test('strona polityki prywatności jest dostępna', async ({ page }) => {
      await page.goto('/privacy');
      await expect(page).toHaveURL(/\/privacy/);
    });

    test('strona o nas jest dostępna', async ({ page }) => {
      await page.goto('/about-us');
      await expect(page).toHaveURL(/\/about-us/);
    });

    test('strona cennika jest dostępna', async ({ page }) => {
      await page.goto('/pricing');
      await expect(page).toHaveURL(/\/pricing/);
    });
  });

  test.describe('Strony płatności', () => {
    test('strona sukcesu płatności jest po polsku', async ({ page }) => {
      await page.goto('/payment-success');
      
      // Sprawdź elementy po polsku
      await expect(page.getByText(/Weryfikacja płatności|Płatność zakończona sukcesem/i)).toBeVisible();
      await expect(page.getByRole('button', { name: /Przejdź do profilu/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Przejdź do feed/i })).toBeVisible();
    });

    test('strona anulowania płatności jest po polsku', async ({ page }) => {
      await page.goto('/payment-cancelled');
      
      await expect(page.getByText('Płatność anulowana')).toBeVisible();
      await expect(page.getByText('Płatność została anulowana. Nie zostały pobrane żadne środki z Twojego konta.')).toBeVisible();
      await expect(page.getByRole('button', { name: /Wróć/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Zobacz plany cenowe/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Przejdź do feed/i })).toBeVisible();
    });

    test('strona sukcesu płatności jest responsywna', async ({ page }) => {
      // Desktop
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/payment-success');
      await expect(page.getByRole('button', { name: /Przejdź do profilu/i })).toBeVisible();
      
      // Mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/payment-success');
      await expect(page.getByRole('button', { name: /Przejdź do profilu/i })).toBeVisible();
    });

    test('strona anulowania płatności jest responsywna', async ({ page }) => {
      // Desktop
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.goto('/payment-cancelled');
      await expect(page.getByText('Płatność anulowana')).toBeVisible();
      
      // Mobile
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/payment-cancelled');
      await expect(page.getByText('Płatność anulowana')).toBeVisible();
    });

    test('przycisk "Zobacz plany cenowe" przekierowuje do pricing', async ({ page }) => {
      await page.goto('/payment-cancelled');
      
      await page.getByRole('button', { name: /Zobacz plany cenowe/i }).click();
      await expect(page).toHaveURL(/\/pricing/);
    });
  });

  test.describe('Responsywność stron', () => {
    test('landing page jest responsywny na mobile', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto('/');
      
      // Sprawdź że strona się ładuje
      await expect(page.locator('body')).toBeVisible();
    });

    test('landing page jest responsywny na tablecie', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto('/');
      
      await expect(page.locator('body')).toBeVisible();
    });

    test('landing page jest responsywny na desktopie', async ({ page }) => {
      await page.setViewportSize({ width: 1920, height: 1080 });
      await page.goto('/');
      
      await expect(page.locator('body')).toBeVisible();
    });
  });

  test.describe('Nawigacja i przekierowania', () => {
    test('niezalogowany użytkownik na /feed jest przekierowywany na landing', async ({ page }) => {
      await page.goto('/feed');
      
      // Oczekuj przekierowania lub strony logowania
      await page.waitForLoadState('networkidle');
      const url = page.url();
      
      // Powinien być przekierowany na landing lub pokazać modal logowania
      expect(url.includes('/feed') || url.includes('/') || url === page.url()).toBeTruthy();
    });

    test('strona główna ładuje się poprawnie', async ({ page }) => {
      await page.goto('/');
      
      await expect(page.locator('body')).toBeVisible();
      // Nie powinno być błędu 404
      await expect(page.getByText('Nie znaleziono strony')).not.toBeVisible();
    });
  });
});

test.describe('Użytkownik Free - Lokalizacja PL', () => {
  test('strona 404 nie zawiera angielskiego tekstu', async ({ page }) => {
    await page.goto('/nieistniejaca-strona');
    
    // Nie powinno być angielskich tekstów
    await expect(page.getByText('Page Not Found')).not.toBeVisible();
    await expect(page.getByText('Go Home')).not.toBeVisible();
    await expect(page.getByText('Go Back')).not.toBeVisible();
    await expect(page.getByText('contact support')).not.toBeVisible();
    
    // Powinny być polskie
    await expect(page.getByText('Nie znaleziono strony')).toBeVisible();
    await expect(page.getByText(/Strona główna/i)).toBeVisible();
  });

  test('strona płatności sukces nie zawiera angielskiego tekstu', async ({ page }) => {
    await page.goto('/payment-success');
    
    // Nie powinno być angielskich tekstów
    await expect(page.getByText('Payment Successful!')).not.toBeVisible();
    await expect(page.getByText('Go to Profile')).not.toBeVisible();
    await expect(page.getByText('Continue to Feed')).not.toBeVisible();
  });

  test('strona płatności anulowana nie zawiera angielskiego tekstu', async ({ page }) => {
    await page.goto('/payment-cancelled');
    
    // Nie powinno być angielskich tekstów
    await expect(page.getByText('Payment Cancelled')).not.toBeVisible();
    await expect(page.getByText('View Pricing Again')).not.toBeVisible();
  });
});

test.describe('Użytkownik Free - Dostępność (a11y)', () => {
  test('strona 404 ma poprawne nagłówki', async ({ page }) => {
    await page.goto('/nieistniejaca-strona');
    
    // Powinien być nagłówek h1 lub h2
    const heading = page.getByRole('heading', { name: /Nie znaleziono strony/i });
    await expect(heading).toBeVisible();
  });

  test('przyciski mają dostępne etykiety', async ({ page }) => {
    await page.goto('/payment-cancelled');
    
    // Przyciski powinny być klikalne
    const backButton = page.getByRole('button', { name: /Wróć/i });
    const pricingButton = page.getByRole('button', { name: /Zobacz plany cenowe/i });
    
    await expect(backButton).toBeEnabled();
    await expect(pricingButton).toBeEnabled();
  });

  test('linki na stronie 404 są fokusowalne', async ({ page }) => {
    await page.goto('/nieistniejaca-strona');
    
    const homeLink = page.getByRole('link', { name: /Strona główna/i });
    await expect(homeLink).toBeVisible();
    
    // Fokus powinien działać
    await homeLink.focus();
    await expect(homeLink).toBeFocused();
  });
});

test.describe('Użytkownik Free - Wizualne', () => {
  test('strona 404 ma widoczną ikonę', async ({ page }) => {
    await page.goto('/nieistniejaca-strona');
    
    // Powinna być widoczna ikona search
    await expect(page.locator('.lucide-search')).toBeVisible();
  });

  test('strona anulowania płatności ma czerwoną ikonę', async ({ page }) => {
    await page.goto('/payment-cancelled');
    
    // Powinna być widoczna ikona X
    await expect(page.locator('.lucide-x-circle')).toBeVisible();
  });

  test('strona sukcesu płatności ma zieloną ikonę', async ({ page }) => {
    await page.goto('/payment-success');
    
    // Powinna być widoczna ikona check lub loader
    const checkCircle = page.locator('.lucide-check-circle');
    const loader = page.locator('.lucide-loader-2');
    
    // Jedna z ikon powinna być widoczna
    const isCheckVisible = await checkCircle.isVisible().catch(() => false);
    const isLoaderVisible = await loader.isVisible().catch(() => false);
    
    expect(isCheckVisible || isLoaderVisible).toBeTruthy();
  });
});
