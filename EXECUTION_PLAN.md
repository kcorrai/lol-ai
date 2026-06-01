# EXECUTION_PLAN.md — LoL AI Coach

**Rol:** Staff Engineer / Engineering Manager  
**Amaç:** Projeyi güvenli, kontrollü ve mimari bütünlüğü koruyarak inşa etmek.  
**Bu dosya değişmez.** Süreç değişirse yeni bir versiyon numarası alır.

---

## 0. Temel Kural

> Bir anda sadece bir task vardır. Diğerleri yoktur.

Bu kurala uymak, tüm diğer kuralları gereksiz kılar. Uymamak, tüm diğer kuralları işe yaramaz hale getirir.

---

## 1. Geliştirme Stratejisi

### 1.1 Task Sıralaması ve Mantığı

Task'lar bağımlılık zinciri dikkate alınarak aşağıdaki sırada uygulanır. **Bu sıra değiştirilemez.**

```
TASK-001  Project Bootstrap          ← bağımlılık yok, temel altyapı
    │
TASK-003  Database Schema            ← 001'e bağlı
    │                                  ⚠️ Auth tabloları burada migrate edilir.
    │                                  TASK-002 başlamadan önce bu tamamlanmalı.
    │
TASK-002  Authentication             ← 001 + 003 (migrate uygulanmış olmalı)
    │
TASK-014  Champion Static Data       ← 003'e bağlı, erken tamamlanması iyi
    │
TASK-004  Riot API Integration       ← 001, 002, 003
    │
TASK-005  Match History Sync         ← 004'e bağlı
    │
    ├── TASK-006  Match History UI   ← 005 (mock data ile 005 bitmeden başlanabilir)
    │
    ├── TASK-007  Champion Stats     ← 005
    │
    ├── TASK-010  Ranked Tracker     ← 004, 005
    │
TASK-008  AI Client (infra)          ← 001, 003 (diğerlerinden bağımsız, erken başlanabilir)
    │
TASK-009  AI Coaching Pipeline       ← 008, 005, 007, 003
    │
TASK-012  Dashboard & App Shell      ← 002, 004, 010, 006 (iskelet önce, data sonra)
    │
TASK-011  Subscription / Stripe      ← 002, 003
    │
TASK-013  Landing Page               ← 001, 011 (en sona kalabilir)
    │
TASK-015  Beta Launch Checklist      ← tüm task'lar tamamlandıktan sonra
```

### 1.2 Paralel Başlanabilecek Task'lar

Bağımlılıklar karşılandığında şu task'lar paralel yürütülebilir:

| Paralel Grup | Task'lar | Koşul | Not |
|---|---|---|---|
| ~~Grup A~~ | ~~002 + 003~~ | ~~TASK-001 sonrası~~ | ❌ **Geçersiz** — 002, 003'ün migrate çıktısına bağımlı |
| Grup B | 006 + 007 + 010 | TASK-005 tamamlandıktan sonra | ✅ Geçerli |
| Grup C | 011 + 013 | TASK-002, 003 tamamlandıktan sonra | ✅ Geçerli |

**Tek geliştirici ortamında:** Paralel çalışma önerilmez. Sıralı ilerle, bağımlılıkları bloke eden task'ı önce bitir.

### 1.3 Task İzolasyonu

Her task kendi sınırları içinde yaşar. Task başladığında şu soru sorulur:

> "Bu task'ın dokunması gereken dosyalar tam olarak hangileri?"

Bu soruya verilen cevap dışındaki hiçbir dosyaya dokunulmaz. Başka bir dosyada sorun görülürse not alınır, ticket açılır, o task'ta düzeltilmez.

### 1.4 Context Limit Yönetimi

Claude Code'un context'i şişerse analiz kalitesi düşer ve yanlış kararlar alınır.

Kurallar:
- Her task için **yeni bir Claude Code oturumu** başlatılır.
- Önceki task'ın konuşma geçmişi aktarılmaz.
- Oturum başlangıcında sadece o task'a ait bağlam aktarılır (aşağıdaki Section 4'te açıklandı).
- Tek oturumda 2 saatten uzun süre çalışılmaz — context'i temizlemek için mola ver.

---

## 2. Task Çalıştırma Kuralları

Bu kurallar tartışmaya açık değildir. Her task için geçerlidir.

### 2.1 Dokunma Kuralı

```
Task dosyasında listelenen dosyalar → dokunulabilir
Task dosyasında listelenmeyen dosyalar → dokunulamaz
```

Tek istisna: `package.json` — yeni bağımlılık eklenmesi gerekiyorsa ve task bunu açıkça gerektiriyorsa izin verilir. Her yeni paket için nedeni `CLAUDE.md`'deki bağımlılık kuralına göre justifiye edilmelidir.

### 2.2 Kapsam Kuralı

Task dosyası ne söylüyorsa o yapılır. Task şunu söylüyor:
- "Kullanıcı X yapabilmeli" → sadece bunu implement et
- "Y bileşeni oluştur" → sadece bunu oluştur

Task dosyası şunu söylemiyorsa:
- Bir şeyi "daha iyi hale getirmek" için dokunma
- "Şu zaten yanlış görünüyor" diyerek düzeltme
- Gelecekteki task'a ait mantığı ekleme ("bir sonraki task için hazırlık yapalım" yasak)

### 2.3 Refactor Yasağı

Bir task'ta refactor görürsen:
1. Dur.
2. Refactor'ı ayrı bir task olarak `docs/tasks/TASK-0XX-refactor-yyy.md` olarak yaz.
3. Mevcut task'a devam et.

Refactor gerekliyse, o ayrı task açılır, backlog'a eklenir, sırasında yapılır.

### 2.4 Mimari Değişiklik Yasağı

Task sırasında şunu fark edersen: "Bu mimari kararı değiştirmem gerekiyor" —

Bu bir mimari karar gerektiriyor demektir. Şunları yap:
1. Task'ı durdur.
2. `docs/adr/ADR-XXX-title.md` yaz (Architecture Decision Record).
3. Kararı gözden geçir.
4. Sadece sonra devam et.

Kodu değiştirerek mimariyi "düzeltme" yoktur.

---

## 3. Güvenli Geliştirme Akışı

Her task için adım adım bu akış takip edilir. Adım atlanmaz.

---

### Adım 1 — Task Başlatma

```
1. `git checkout develop`
2. `git pull origin develop`
3. `git checkout -b feature/TASK-XXX-kısa-açıklama`
4. Task dosyasını oku: `docs/tasks/TASK-XXX.md`
5. Acceptance criteria listesini başka bir yerde aç (not defteri, başka sekme)
6. "Hangi dosyalara dokunacağım?" sorusunu cevapla — listele
7. Yeni Claude Code oturumu başlat (Section 4'teki prompt template kullan)
```

---

### Adım 2 — Task Analizi

Claude'a sormadan önce kendin şunu düşün:

- Acceptance criteria'nın her maddesi için: "Bunu nasıl implement edeceğim?"
- Bağımlılıklar gerçekten hazır mı? (import edebiliyor muyum?)
- Hangi Prisma modelleri gerekiyor? Var mı?
- Hangi API endpoint'leri gerekiyor? Var mı yoksa bu task mı yapıyor?

Belirsizlik varsa: task dosyasına dön, `docs/ARCHITECTURE.md`'ye dön, sonra Claude'a sor. Sıra bu.

---

### Adım 3 — Implementation

```
Kural: En küçük değişiklikle acceptance criteria'yı karşıla.
```

Sıra:
1. Önce tip tanımları (`types.ts` dosyaları)
2. Sonra veri katmanı (Prisma repository / db calls)
3. Sonra servis katmanı (iş mantığı)
4. Sonra API katmanı (route handlers)
5. En son UI katmanı (components, pages)

Her katmanı bitirince bir commit at. Büyük commit'ler yasak.

Commit sıklığı: Her mantıklı tamamlanmış birim için commit. "Bu fonksiyon çalışıyor" commit değeri var. "Bir şeyler yaptım" commit değeri yok.

---

### Adım 4 — Test ve Doğrulama

Task'ın "Definition of Done"ı acceptance criteria listesidir.

```
Her madde için:
  [ ] Acceptance criteria maddesi neydi?
  [ ] Bunu nasıl doğruladım?
  [ ] Test dosyası var mı? (servis/util için zorunlu)
```

Manuel doğrulama akışı:
1. `npm run dev` çalıştır
2. Task'ın ana akışını elle test et (happy path)
3. Hata durumlarını test et (geçersiz input, API hatası vb.)
4. `npm run typecheck` — hata yok
5. `npm run lint` — hata yok
6. Birim testler varsa: `npm test` — geçiyor

---

### Adım 5 — Task Bitirme

```
1. Tüm acceptance criteria check edildi
2. Testler geçiyor
3. TypeScript hata yok
4. Lint hata yok
5. Son commit atıldı
6. `git push origin feature/TASK-XXX-...`
7. PR açıldı (develop branch'e)
8. PR description'ına TASK-XXX numarası yazıldı
9. Branch merge edildi
10. Feature branch silindi
```

---

### Adım 6 — Review ve Geçiş

Merge sonrası:
- `develop` branch'inde smoke test yap (deploy preview var mı? varsa test et)
- Bir sonraki task'ı başlatmadan önce 15 dakika bekle (mental ayrışma)
- Sonraki task'ın bağımlılıkları hazır mı kontrol et

Eğer bir task beklenenden zorsa veya mimari karar gerektiriyorsa:
**Dur. Devam etme. Review iste.**

---

## 4. Claude Code Kullanım Stratejisi

### 4.1 Her Task İçin Oturum Başlatma Promptu

Yeni bir oturuma başlarken Claude'a şu bilgileri ver:

```
Proje: LoL AI Coach — Next.js, TypeScript, PostgreSQL, Prisma, TailwindCSS
Stack: Next.js 14 App Router, Prisma ORM, NextAuth, TanStack Query, Zustand

Aktif Task: TASK-XXX — [task adı]

Bu task'ta sadece şu dosyalara dokunacağız:
- [dosya1]
- [dosya2]
- [dosya3]

Bu task'ta yapılmayacaklar:
- Refactor
- Mimari değişiklik  
- Başka task'ların dosyaları

Acceptance criteria:
[TASK dosyasının acceptance criteria listesini buraya yapıştır]

Mimari kararlar için: docs/ARCHITECTURE.md'ye ve docs/PROJECT_STRUCTURE.md'ye uyulacak.
Kod standartları için: CLAUDE.md geçerlidir.
```

Bu promptu her oturum başında kullan. Önceki oturumdan referans verme.

### 4.2 Context Şişmesini Önleme

Context şişmesinin işaretleri:
- Claude daha önce söylediği şeyin aksini söylüyor
- Claude var olmayan fonksiyonlara reference yapıyor
- Claude "haydi her şeyi yeniden yapılandıralım" diyor
- Cevaplar giderek uzuyor ve odaklanmadan çıkıyor

Bu işaretleri görürsen: **Oturumu kapat. Yeni oturum başlat.**

### 4.3 Claude'a Görev Verme Granülaritesi

**Doğru:** "Sadece `matchMapper.ts` dosyasını yaz. Input tipi şu, output tipi şu."

**Yanlış:** "Match pipeline'ı yaz."

**Doğru:** "`GET /api/matches` endpoint'ini yaz. Prisma query şöyle olmalı, response shape şöyle."

**Yanlış:** "Match API'yi implement et."

Her Claude çağrısı tek bir dosya veya tek bir fonksiyon için yapılır. Claude'dan "büyük resmi" implement etmesini isteme — küçük parçaları birleştir.

### 4.4 Claude Çıktısını Doğrulama

Claude'un yazdığı her kod şu 4 soruya cevap vermelidir:

1. **Mimari uyumlu mu?** — Doğru katmanda mı? Yasak import var mı?
2. **TypeScript temiz mi?** — `any` var mı? Tip eksik mi?
3. **Güvenli mi?** — Input validate ediliyor mu? Secret var mı?
4. **Test edilebilir mi?** — Yan etkiler izole mi?

Claude "bu işe yarar" dedi diye çalıştırma. Oku. Anla. Sonra uygula.

### 4.5 Ne Zaman Claude'a Sorulur, Ne Zaman Sorulmaz

**Sorulur:**
- "Bu Prisma query'i nasıl optimize ederim?"
- "Bu Zod schema doğru mu?"
- "Bu test case'i eksik mi?"
- "Bu error boundary nasıl yapılandırılır?"

**Sorulmaz:**
- "Bu mimariyi nasıl değiştirelim?"  
  → `docs/ARCHITECTURE.md`'ye bak
- "Hangi task sırasıyla yapılmalı?"  
  → Bu dosyaya bak
- "Bu feature'ı nasıl tasarlayalım?"  
  → `docs/FEATURES.md`'ye bak
- "Veritabanı schema nasıl olmalı?"  
  → `docs/DATABASE_SCHEMA.md`'ye bak

Claude kod üretmek için kullanılır. Karar vermek için değil. Kararlar dokümanlarda.

---

## 5. Git Stratejisi

### 5.1 Branch Yapısı

```
main          ← production (sadece release merge'leri)
  └── develop ← entegrasyon branch'i, tüm task'lar buraya merge edilir
        └── feature/TASK-XXX-kısa-aciklama  ← aktif geliştirme
```

Branch kuralları:
- `main`'e direkt commit yasak. Her zaman PR.
- `develop`'a direkt commit yasak. Her zaman feature branch → PR.
- Feature branch isimlendirmesi: `feature/TASK-001-project-bootstrap`
- Fix branch isimlendirmesi: `fix/TASK-003-migration-error`

### 5.2 Commit Standardı

Format (Conventional Commits):
```
<type>(<scope>): <kısa açıklama>

[opsiyonel body]

refs TASK-XXX
```

Type listesi:
```
feat     → yeni özellik
fix      → bug fix
chore    → build, config, bağımlılık
test     → test ekleme/düzenleme
docs     → sadece dokümantasyon
refactor → davranış değişmeden yeniden düzenleme (ayrı task gerektirir)
```

Örnekler:
```
feat(riot): add Riot account connection endpoint
fix(auth): handle missing session on dashboard redirect
chore(deps): add @upstash/redis for cache layer
test(analysis): unit tests for KDA calculator
```

Kötü commit mesajları:
```
"fix stuff"
"wip"
"changes"
"update code"
"it works now"
```

Bu tür commit'ler main/develop'a kabul edilmez.

### 5.3 Commit Granülaritesi

**Bir commit = bir mantıksal tamamlanmış birim.**

Bir task içinde beklenen commit sayısı: 3–8.

```
Örnek TASK-005 commit akışı:
1. "chore(riot): add match v5 API types"
2. "feat(riot): implement match ID list fetcher"  
3. "feat(riot): implement full match detail fetcher"
4. "feat(riot): add match mapper (raw → domain model)"
5. "feat(riot): implement match sync orchestrator"
6. "test(riot): unit tests for matchMapper"
7. "feat(api): add POST /api/riot/:id/sync endpoint"
```

### 5.4 Rollback Stratejisi

**Senaryo 1 — Task içinde bozulma:**
```bash
git diff                    # neyin değiştiğini gör
git checkout -- <dosya>     # tek dosyayı geri al
git reset --soft HEAD~1     # son commit'i geri al (dosyalar değişmiş kalır)
```

**Senaryo 2 — Task tamamlandı ama develop'a merge sonrası sorun:**
```bash
git revert <merge-commit-hash>    # merge'i revert et, yeni commit oluşturur
```
Force push veya history rewrite kullanılmaz. Revert ile ileri git.

**Senaryo 3 — Database migration bozuldu:**
```bash
npx prisma migrate reset    # sadece development'ta!
# production'da:
npx prisma migrate resolve --rolled-back <migration-name>
```
Migration rollback'i için her zaman `DOWN` migration hazır olmalı veya manuel SQL yazılmalı.

**Senaryo 4 — Yanlış branch'e commit atıldı:**
```bash
git log --oneline -5             # commit hash'ini bul
git checkout feature/doğru-branch
git cherry-pick <commit-hash>    # commit'i taşı
git checkout yanlış-branch
git reset --hard HEAD~1          # yanlış branch'ten kaldır
```

### 5.5 PR (Pull Request) Kuralları

Her PR şunları içermelidir:
1. Başlık: `[TASK-XXX] Kısa açıklama`
2. Description: acceptance criteria checklist (tamamlananlar işaretli)
3. "Testing done" bölümü: ne test edildi, nasıl

PR'ı merge etmeden önce:
- `typecheck` geçiyor mu?
- `lint` geçiyor mu?
- Açıkça bozulmuş bir şey var mı? (manuel smoke test)

---

## 6. Risk Yönetimi

### 6.1 Sistemi Bozabilecek Şeyler

**Risk 1 — Mimari kayma (Architecture drift)**

Belirtisi: Servis katmanında doğrudan Prisma çağrısı görülüyor. API handler'da iş mantığı var. Domain boundary ihlalleri.

Tetikleyici: Claude'un "kısayol" önermesi. "Direkt şuradan çek, daha basit" gibi öneriler.

Önlem: Her PR'da mimari kontrol. Handler ≤ 30 satırsa doğru yoldayız. ≥ 100 satırsa bir şeyler yanlış.

---

**Risk 2 — TypeScript kalitesi düşüşü**

Belirtisi: `as any`, `// @ts-ignore`, tip olmayan parametreler.

Tetikleyici: "Hızlıca ilerleyelim" baskısı. Claude'un lazy tipler üretmesi.

Önlem: `tsconfig.json`'da `"strict": true` çıkarılamaz. CI'da `typecheck` zorunlu. `any` gören PR'ı merge etme.

---

**Risk 3 — Test borcu birikimi**

Belirtisi: 5 task geçti, test yok. "Sonra yazarız" zihniyeti.

Tetikleyici: Zaman baskısı. "MVP için test gerekmez" düşüncesi.

Önlem: `coachingService.ts`, `matchMapper.ts`, `aiClient.ts` gibi kritik servisler test olmadan tamamlanmış sayılmaz. Acceptance criteria'ya bakılır.

---

**Risk 4 — Scope creep (kapsam kayması)**

Belirtisi: TASK-006 yaparken TASK-009'un bir parçasını "şimdiden ekledim" durumu.

Tetikleyici: "Zaten buradayken" mantığı. Claude'un "bunu da ekleyeyim mi?" önerileri.

Önlem: Task dosyasını her 30 dakikada bir oku. "Bu değişiklik task dosyasında var mı?" sorusunu sor.

---

**Risk 5 — Riot API rate limit baskısı**

Belirtisi: Development sırasında 429 hataları. Test edemiyor duruma gelme.

Tetikleyici: TASK-005'te gereksiz API çağrıları. Cache olmadan tekrar tekrar istek atma.

Önlem: Development'ta fixture data kullan. Gerçek API çağrısını entegrasyon testleriyle sınırla. Cache layer (TASK-008 sonrası) aktif olmadan production'a geçme.

---

**Risk 6 — AI maliyet kontrolsüzlüğü**

Belirtisi: Her test çağrısında gerçek AI API'sine istek atılıyor.

Tetikleyici: TASK-009 testlerinde mock kullanılmaması.

Önlem: `aiClient.ts`'in test ortamında mock edilmesi zorunlu. `AI_PROVIDER=mock` env var'ı tanımlanmalı. Gerçek AI çağrısı sadece manuel integration test'te yapılır.

---

**Risk 7 — Claude'un yanlış yönlendirmesi**

Belirtisi: Claude "bence bu mimariyi şöyle değiştirelim" diyor. Claude mevcut dokümana bakmadan farklı bir yapı öneriyor. Claude büyük bir refactor yapıyor.

Tetikleyici: Context büyüdüğünde veya belirsiz prompt verildiğinde Claude "daha iyi" çözüm üretmeye çalışır.

Önlem (sıralı):
1. "Dur. Mevcut mimariyi değiştirmiyoruz." de.
2. Claude'u `docs/ARCHITECTURE.md`'ye yönlendir.
3. Eğer Claude ısrar ediyorsa: oturumu kapat, yeni oturum başlat, daha spesifik prompt kullan.
4. Eğer Claude'un önerisi gerçekten geçerliyse: ADR yaz, ayrı task aç, sonra değerlendir.

---

### 6.2 Erken Hata Tespiti

Her task sonunda şu kontroller yapılır:

```
□ npm run typecheck → sıfır hata
□ npm run lint      → sıfır hata
□ npm run test      → sıfır fail (varsa)
□ Tarayıcıda: happy path manuel test geçti
□ Prisma Studio: DB'de beklenen kayıtlar var
□ Yeni API route varsa: Postman/curl ile test edildi
```

Bu kontrollerin biri başarısız olursa commit atılmaz. Düzeltilir, sonra commit.

### 6.3 Mimari Bozulma Tespiti

Haftalık (veya her 5 task'ta bir) mimari sağlık kontrolü:

```bash
# Domain dışı import var mı?
grep -r "from.*domains" src/lib/
grep -r "from.*lib/db" src/components/

# Handler'larda iş mantığı var mı?
wc -l app/api/**/*.ts  # 80+ satır varsa şüphelenilir

# any kullanımı var mı?
grep -rn ": any" src/
grep -rn "as any" src/
```

Sonuçlarda beklenmedik bir şey çıkarsa: düzeltme task'ı aç.

### 6.4 "Kurtarma" Protokolü

Durum: Bir task ortasında her şey karıştı, ne yaptığını bilmiyorsun.

```
1. git stash                    → değişiklikleri sakla
2. git status                   → neyin değiştiğini gör
3. task dosyasını yeniden oku   → ne yapmak istiyordun?
4. git stash pop                → değişiklikleri geri al
5. sadece bir dosyaya odaklan   → en küçük parçayı tamamla
```

Durum: Bir task tamamlandı ama develop merge sonrası sistem çalışmıyor.

```
1. develop'ta son çalışan commit'i bul: git log --oneline
2. Sorunu izole et: hangi commit bozdu?
3. git revert <bozuk-commit>
4. Hatayı analiz et
5. fix/TASK-XXX-hotfix branch'i aç, düzelt, merge et
```

---

## 7. Geliştirme Takvimi Rehberi

Bu takvim kesin değildir, referans noktasıdır.

| Hafta | Task'lar | Kritik Çıktı |
|---|---|---|
| Hafta 1 | 001, 002, 003 | Çalışan auth + DB |
| Hafta 2 | 014, 004 | Riot hesap bağlama |
| Hafta 3 | 005, 006 | Maç geçmişi görünür |
| Hafta 4 | 007, 008, 010 | Champion stats + AI altyapı |
| Hafta 5 | 009 | İlk AI koçluk raporu |
| Hafta 6 | 012, 011 | Dashboard + ödeme sistemi |
| Hafta 7 | 013, 015 | Landing page + beta kontrolü |
| Hafta 8 | Buffer | Test, bug fix, kalite |

Eğer bir task takvimin 2 katı süre alıyorsa: task'ı daha küçük parçalara böl veya scope'u daralt.

---

## 8. "Bitti" Tanımı

Bir task ancak şunların tamamı karşılandıysa bitti sayılır:

```
□ Tüm acceptance criteria karşılandı
□ TypeScript strict — sıfır hata
□ ESLint — sıfır hata
□ Birim testler var ve geçiyor (servisler için)
□ Happy path manuel olarak test edildi
□ Hata durumları kullanıcıya düzgün gösteriliyor
□ PR merge edildi
□ develop branch'inde çalışıyor
```

"Çalışıyor gibi görünüyor" bitti değildir.  
"Local'de çalışıyor" bitti değildir.  
"Testler geçiyor ama UI test etmedim" bitti değildir.
