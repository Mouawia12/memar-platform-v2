// PHASE 2: Update PriceCalc2 to use package basePrice for package mode
const fs = require('fs');
let c = fs.readFileSync('erp/pricing2.js', 'utf8');

const oldCalc = `const PriceCalc2 = {
  getAreaTier(area) {
    return PricingDB2.areaTiers.find(t => area <= t.max) || PricingDB2.areaTiers.at(-1);
  },

  getServiceRate(svcId) {
    const svc = PricingDB2.services.find(s => s.id === svcId);
    if (!svc) return 0;
    if (svc.emptyPrice) {
       return PricingState2.editedPrices[svcId] !== undefined ? PricingState2.editedPrices[svcId] : null;
    }
    return PricingState2.editedPrices[svcId] ?? svc.baseRate;
  },

  calcService(svcId, area) {
    const svc = PricingDB2.services.find(s => s.id === svcId);
    if (!svc) return 0;
    const rate    = this.getServiceRate(svcId);
    if (rate === null) return 0;

    const catMult = PricingDB2.catMult[PricingState2.category] || 1;

    if (svc.unit !== 'م²') return rate * catMult;

    const tier      = this.getAreaTier(area);
    const tierMult  = tier.custom ? 1 : tier.mult;
    return area * rate * catMult * tierMult;
  },

  calcGovFees(area) {
    if (!PricingState2.govFees) return [];
    return PricingDB2.govFees
      .filter(f => f.visible && f.categories.includes(PricingState2.category))
      .map(f => ({ ...f, total: f.base + f.perM2 * area }));
  },

  calcAddons() {
    return PricingState2.addons.map(id => {
      const a = PricingDB2.addons.find(x => x.id === id);
      return a ? { ...a, total: a.price } : null;
    }).filter(Boolean);
  },

  getPackageDiscount() {
    const pkg = PricingDB2.packages.find(p => p.id === PricingState2.package);
    return pkg ? pkg.discount : 0;
  },

  calcTotal() {
    const area     = PricingState2.area || 0;
    const services = PricingState2.services;
    const pkg      = PricingDB2.packages.find(p => p.id === PricingState2.package);
    const discount = pkg?.discount || 0;
    const isCustomTier = this.getAreaTier(area).custom;

    const serviceLines = services.map(id => ({
      id,
      svc: PricingDB2.services.find(s => s.id === id),
      amount: this.calcService(id, area),
      isManual: this.getServiceRate(id) === null
    })).filter(l => l.svc);

    let packageServicesTotal = 0;
    let standaloneServicesTotal = 0;

    serviceLines.forEach(l => {
       if (pkg && pkg.id !== 'custom' && pkg.services.includes(l.id)) {
           packageServicesTotal += l.amount;
       } else {
           standaloneServicesTotal += l.amount;
       }
    });

    const servicesTotal  = packageServicesTotal + standaloneServicesTotal;
    const discountAmount = packageServicesTotal * (discount / 100);
    const netServices    = servicesTotal - discountAmount;

    const addonLines = this.calcAddons();
    const addonsTotal = addonLines.reduce((s, a) => s + a.total, 0);

    const feeLines   = this.calcGovFees(area);
    const feesTotal  = feeLines.reduce((s, f) => s + f.total, 0);

    const grandTotal = netServices + addonsTotal + feesTotal;

    const hasManualPricing = serviceLines.some(l => l.isManual) || isCustomTier;

    return {
      area, services: serviceLines,
      servicesTotal, packageServicesTotal, standaloneServicesTotal,
      discountAmount, discount, netServices,
      addonLines, addonsTotal,
      feeLines, feesTotal,
      grandTotal,
      isCustomTier,
      hasManualPricing
    };
  },
};`;

const newCalc = `const PriceCalc2 = {
  getAreaTier(area) {
    return PricingDB2.areaTiers.find(t => area <= t.max) || PricingDB2.areaTiers.at(-1);
  },

  // Get service rate — checks per-sector overrides first, then admin edits, then baseRate
  getServiceRate(svcId) {
    const svc = PricingDB2.services.find(s => s.id === svcId);
    if (!svc) return 0;
    if (svc.emptyPrice) {
      return PricingState2.editedPrices[svcId] !== undefined ? PricingState2.editedPrices[svcId] : null;
    }
    if (PricingState2.editedPrices[svcId] !== undefined) return PricingState2.editedPrices[svcId];
    // Per-sector rate override
    const sectorRate = PricingDB2.sectorRates?.[PricingState2.category]?.[svcId];
    return sectorRate !== undefined ? sectorRate : svc.baseRate;
  },

  calcService(svcId, area) {
    const svc = PricingDB2.services.find(s => s.id === svcId);
    if (!svc) return 0;
    const rate = this.getServiceRate(svcId);
    if (rate === null) return 0;
    if (svc.unit !== 'م²') return rate;
    const tier = this.getAreaTier(area);
    const tierMult = tier.custom ? 1 : tier.mult;
    return area * rate * tierMult;
  },

  // Package final price = basePrice × area tier multiplier
  calcPackagePrice(pkg, area) {
    if (!pkg || !pkg.basePrice) return 0;
    const tier = this.getAreaTier(area);
    if (tier.custom) return null; // manual pricing
    return pkg.basePrice * tier.mult;
  },

  calcGovFees(area) {
    if (!PricingState2.govFees) return [];
    return PricingDB2.govFees
      .filter(f => f.visible && f.categories.includes(PricingState2.category))
      .map(f => ({ ...f, total: f.base + f.perM2 * area }));
  },

  calcAddons() {
    return PricingState2.addons.map(id => {
      const a = PricingDB2.addons.find(x => x.id === id);
      return a ? { ...a, total: a.price } : null;
    }).filter(Boolean);
  },

  calcTotal() {
    const area = PricingState2.area || 0;
    const pkg = PricingDB2.packages.find(p => p.id === PricingState2.package);
    const isCustomPkg = !pkg || pkg.id === 'custom';
    const tier = this.getAreaTier(area);
    const isCustomTier = tier.custom;

    // ── PACKAGE MODE: fixed price ──────────────────
    if (!isCustomPkg) {
      const pkgPrice = this.calcPackagePrice(pkg, area);
      const isManualPkg = pkgPrice === null;

      // Extra standalone services (not in package)
      const extraSvcs = PricingState2.services.filter(id => !pkg.services.includes(id));
      const extraLines = extraSvcs.map(id => ({
        id,
        svc: PricingDB2.services.find(s => s.id === id),
        amount: this.calcService(id, area),
        isManual: this.getServiceRate(id) === null
      })).filter(l => l.svc);

      const extrasTotal = extraLines.reduce((s, l) => s + (l.isManual ? 0 : l.amount), 0);
      const hasManualExtra = extraLines.some(l => l.isManual);

      const addonLines = this.calcAddons();
      const addonsTotal = addonLines.reduce((s, a) => s + a.total, 0);
      const feeLines = this.calcGovFees(area);
      const feesTotal = feeLines.reduce((s, f) => s + f.total, 0);

      const grandTotal = (isManualPkg ? 0 : pkgPrice) + extrasTotal + addonsTotal + feesTotal;

      return {
        mode: 'package',
        area, tier,
        pkg, pkgPrice, isManualPkg,
        pkgServices: pkg.services.map(id => PricingDB2.services.find(s => s.id === id)).filter(Boolean),
        gifts: pkg.gifts || [],
        extraLines, extrasTotal,
        addonLines, addonsTotal,
        feeLines, feesTotal,
        grandTotal,
        isCustomTier,
        hasManualPricing: isManualPkg || hasManualExtra
      };
    }

    // ── CUSTOM/STANDALONE MODE: detailed pricing ──
    const serviceLines = PricingState2.services.map(id => ({
      id,
      svc: PricingDB2.services.find(s => s.id === id),
      amount: this.calcService(id, area),
      isManual: this.getServiceRate(id) === null
    })).filter(l => l.svc);

    const servicesTotal = serviceLines.reduce((s, l) => s + (l.isManual ? 0 : l.amount), 0);
    const addonLines = this.calcAddons();
    const addonsTotal = addonLines.reduce((s, a) => s + a.total, 0);
    const feeLines = this.calcGovFees(area);
    const feesTotal = feeLines.reduce((s, f) => s + f.total, 0);
    const grandTotal = servicesTotal + addonsTotal + feesTotal;
    const hasManualPricing = serviceLines.some(l => l.isManual) || isCustomTier;

    return {
      mode: 'custom',
      area, tier,
      services: serviceLines, servicesTotal,
      discountAmount: 0, discount: 0, netServices: servicesTotal,
      addonLines, addonsTotal,
      feeLines, feesTotal,
      grandTotal, isCustomTier, hasManualPricing
    };
  },
};`;

c = c.replace(oldCalc, newCalc);
fs.writeFileSync('erp/pricing2.js', c, 'utf8');
console.log('Phase 2 done. Lines:', c.split('\n').length);
