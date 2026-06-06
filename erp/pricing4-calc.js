'use strict';
/* MEMAR Pricing Engine 4 — State & Calculator */

const PricingState4 = {
  step: 1,
  client: { id:'', name:'', phone:'', email:'' },
  project: { region:'', block:'', plot:'', category:'residential', type:'new_const', area:400, floors:1, customArea:false },
  pricing: { mode:'package', packageId:'licensing', services:['arch','struct','elec','plumb','facade3d','permit','elec_appr','soil_coord'], addons:[], editedPrices:{}, discount:{type:'none',value:0}, includeGovFees:true },
  display: { showDocs:true, showTimeline:true, showConditions:true, showGifts:true, lang:'ar' },
  admin: { enabled:false },
  notes:'', quoteNumber:'', activeSvcTab:'licensing',
};

const PriceCalc4 = {
  getAreaTier(area) {
    return PricingDB4.areaTiers.find(t => area <= t.max) || PricingDB4.areaTiers.at(-1);
  },
  getServiceRate(svcId) {
    const svc = PricingDB4.services.find(s => s.id === svcId);
    if (!svc) return 0;
    if (svc.emptyPrice) return PricingState4.pricing.editedPrices[svcId] !== undefined ? PricingState4.pricing.editedPrices[svcId] : null;
    if (PricingState4.pricing.editedPrices[svcId] !== undefined) return PricingState4.pricing.editedPrices[svcId];
    const sr = PricingDB4.sectorRates?.[PricingState4.project.category]?.[svcId];
    return sr !== undefined ? sr : svc.baseRate;
  },
  calcService(svcId, area) {
    const svc = PricingDB4.services.find(s => s.id === svcId);
    if (!svc) return 0;
    const rate = this.getServiceRate(svcId);
    if (rate === null) return 0;
    if (svc.unit === 'دور') return rate * (PricingState4.project.floors || 1);
    if (svc.unit !== 'م²') return rate;
    const tier = this.getAreaTier(area);
    return area * rate * (tier.custom ? 1 : tier.mult);
  },
  calcPackagePrice(pkg, area) {
    if (!pkg || pkg.id === 'custom') return 0;
    if (pkg.fixedTiers && pkg.fixedTiers.length) {
      const match = pkg.fixedTiers.find(t => area >= t.min && area <= t.max);
      return match ? match.price : pkg.fixedTiers.at(-1).price;
    }
    return 0;
  },
  calcGovFees(area) {
    if (!PricingState4.pricing.includeGovFees) return [];
    return PricingDB4.govFees.filter(f => f.visible && f.categories.includes(PricingState4.project.category)).map(f => ({...f, total:f.base + f.perM2 * area}));
  },
  calcAddons() {
    return PricingState4.pricing.addons.map(id => {
      const a = PricingDB4.addons.find(x => x.id === id);
      return a ? {...a, total:a.price} : null;
    }).filter(Boolean);
  },
  calcTotal() {
    const S = PricingState4;
    const area = S.project.area || 0;
    const pkg = PricingDB4.packages.find(p => p.id === S.pricing.packageId);
    const isCustom = !pkg || pkg.id === 'custom';
    const tier = this.getAreaTier(area);

    if (!isCustom) {
      const pkgPrice = this.calcPackagePrice(pkg, area);
      const isManual = pkgPrice === null;
      const extraSvcs = S.pricing.services.filter(id => !pkg.services.includes(id));
      const extraLines = extraSvcs.map(id => ({id, svc:PricingDB4.services.find(s=>s.id===id), amount:this.calcService(id,area), isManual:this.getServiceRate(id)===null})).filter(l=>l.svc);
      const extrasTotal = extraLines.reduce((s,l) => s + (l.isManual?0:l.amount), 0);
      const addonLines = this.calcAddons();
      const addonsTotal = addonLines.reduce((s,a) => s + a.total, 0);
      const feeLines = this.calcGovFees(area);
      const feesTotal = feeLines.reduce((s,f) => s + f.total, 0);
      const grandTotal = (isManual?0:pkgPrice) + extrasTotal + addonsTotal + feesTotal;
      return { mode:'package', area, tier, pkg, pkgPrice, isManualPkg:isManual, pkgServices:pkg.services.map(id=>PricingDB4.services.find(s=>s.id===id)).filter(Boolean), gifts:pkg.gifts||[], extraLines, extrasTotal, addonLines, addonsTotal, feeLines, feesTotal, grandTotal, isCustomTier:tier.custom, hasManualPricing:isManual||extraLines.some(l=>l.isManual) };
    }

    const serviceLines = S.pricing.services.map(id => ({id, svc:PricingDB4.services.find(s=>s.id===id), amount:this.calcService(id,area), isManual:this.getServiceRate(id)===null})).filter(l=>l.svc);
    const servicesTotal = serviceLines.reduce((s,l) => s + (l.isManual?0:l.amount), 0);
    const addonLines = this.calcAddons();
    const addonsTotal = addonLines.reduce((s,a) => s + a.total, 0);
    const feeLines = this.calcGovFees(area);
    const feesTotal = feeLines.reduce((s,f) => s + f.total, 0);
    const grandTotal = servicesTotal + addonsTotal + feesTotal;
    return { mode:'custom', area, tier, services:serviceLines, servicesTotal, addonLines, addonsTotal, feeLines, feesTotal, grandTotal, isCustomTier:tier.custom, hasManualPricing:serviceLines.some(l=>l.isManual)||tier.custom };
  },
  fmt(n) { return Number(n).toLocaleString('ar-KW',{minimumFractionDigits:3,maximumFractionDigits:3}) + ' د.ك'; },
};

window.PricingState4 = PricingState4;
window.PriceCalc4 = PriceCalc4;
