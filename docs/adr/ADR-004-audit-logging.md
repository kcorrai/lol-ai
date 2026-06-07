# ADR-004: Append-Only Audit Logging

## Status: Accepted

## Context

B2B müşteriler (esports takımları, akademiler) SOC2 uyumluluğu soruyor.
SOC2 Trust Service Criteria'nın CC6 ve CC7 kategorileri kapsamlı audit trail
gerektiriyor: kim, ne zaman, ne yaptı. GDPR da kullanıcı veri erişiminin
kayıt altına alınmasını zorunlu kılıyor.

## Decision

**Ayrı bir `audit_logs` tablosu kullanıyoruz — application log'lara değil.**

- Tablo yalnızca `INSERT` operasyonunu destekler. `UPDATE` veya `DELETE` hiçbir
  zaman çalıştırılmaz. Bu kural uygulama katmanında `auditService.ts`'de
  zorunlu kılınır.
- `userId` GDPR erasure sırasında `NULL`'a alınır (`ON DELETE SET NULL`).
  Bu sayede kullanıcı verisi silindikten sonra da event kaydı korunur.
- `actorId` ayrı tutulur: admin başkası adına işlem yaparsa iki kimlik de kayıt altına alınır.
- `resource` alanı `action` adından otomatik türetilir (`riot.account.connected` → `riot`).
- Audit hataları ana akışı asla kesmez — `try/catch` ile sessizce loglanır.

### Retention Policy

Audit log kayıtları en az **2 yıl** tutulur. Bu süre SOC2 gereksinimlerinin
üzerindedir ve GDPR Data Minimization ilkesiyle çelişmez (kişisel veri değil,
işlem kaydıdır).

## Consequences

**Artılar:**
- Değiştirilemez kayıt — DB seviyesinde audit integrity
- GDPR erasure ile uyumlu (userId null, event varlığını korur)
- Admin panelinde filtrelenebilir, sayfalandırılmış görünüm
- SOC2 CC6.2, CC6.3 ve CC7.2 gereksinimlerini karşılar

**Eksileri:**
- Tablo zamanla büyüyecek. 2 yıl sonrası için cold storage archival (S3) planlanmalı.
- Uygulama katmanında `UPDATE`/`DELETE` yasağı zımni kuraldır; DB trigger eklenerek
  mekanik olarak da zorlanabilir (future hardening).
- Audit çağrıları her kritik operasyona elle eklenmeli — merkezi middleware yoktur.
