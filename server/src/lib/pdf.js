// PDF generation with PDFKit. Two documents: a property brochure for buyers and a
// summary report for administrators. Both return a Buffer.

import PDFDocument from 'pdfkit';

// Kept in sync with the "Larkspur" web palette (client/src/index.css).
const INK = '#1a1714';
const SOFT = '#5c544b';
const ACCENT = '#137a54';
const LINE = '#e9e4db';

const render = (build) =>
  new Promise((resolve, reject) => {
    const doc = new PDFDocument({ size: 'A4', margin: 50 });
    const chunks = [];
    doc.on('data', (c) => chunks.push(c));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);
    try {
      build(doc);
      doc.end();
    } catch (err) {
      reject(err);
    }
  });

const money = (amount, currency = 'USD', mode) => {
  if (amount == null) return '-';
  const s = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
  return mode === 'RENT' ? `${s}/mo` : s;
};

const sqft = (sqm) => (sqm == null ? null : `${Math.round(sqm * 10.7639).toLocaleString('en-US')} sq ft`);

// ---- property brochure ----

export const propertyBrochurePDF = ({ property, coverImage }) =>
  render((doc) => {
    const width = doc.page.width - 100;
    const place =
      property.location?.formattedAddress ||
      [property.location?.city, property.location?.state].filter(Boolean).join(', ');

    doc.fontSize(9).fillColor(SOFT).text(property.reference);
    doc.moveDown(0.2);
    doc.fontSize(22).fillColor(INK).text(property.title);
    if (place) {
      doc.moveDown(0.15);
      doc.fontSize(11).fillColor(SOFT).text(place);
    }
    doc.moveDown(0.6);

    if (coverImage) {
      try {
        doc.image(coverImage, { fit: [width, 260], align: 'center' });
        doc.moveDown(0.8);
      } catch {
        /* skip a bad image */
      }
    }

    doc
      .fontSize(18)
      .fillColor(ACCENT)
      .text(money(property.price, property.currency, property.listingMode));
    doc.moveDown(0.5);

    const rows = [
      ['Type', property.propertyType?.name],
      ['Listing', property.listingMode === 'RENT' ? 'For rent' : 'For sale'],
      ['Bedrooms', property.bedrooms],
      ['Bathrooms', property.bathrooms],
      ['Floor area', property.floorAreaSqm != null ? sqft(property.floorAreaSqm) : null],
      ['Lot area', property.lotAreaSqm != null ? sqft(property.lotAreaSqm) : null],
      ['Year built', property.yearBuilt],
    ].filter(([, v]) => v != null && v !== '');

    doc.fontSize(10);
    for (const [label, value] of rows) {
      const y = doc.y;
      doc.fillColor(SOFT).text(label, 50, y, { width: 140 });
      doc.fillColor(INK).text(String(value), 190, y);
      doc.moveDown(0.35);
    }

    doc.moveDown(0.4);
    doc
      .strokeColor(LINE)
      .moveTo(50, doc.y)
      .lineTo(doc.page.width - 50, doc.y)
      .stroke();
    doc.moveDown(0.6);

    doc.fontSize(11).fillColor(INK).text(property.description, { align: 'left' });

    if (property.agent) {
      doc.moveDown(1);
      doc.fontSize(9).fillColor(SOFT).text('Contact');
      doc.moveDown(0.15);
      doc
        .fontSize(11)
        .fillColor(INK)
        .text(
          `${property.agent.user.firstName} ${property.agent.user.lastName}` +
            (property.agent.title ? `, ${property.agent.title}` : ''),
        );
      const contact = [property.agent.user.email, property.agent.user.phone].filter(Boolean).join('  |  ');
      if (contact) doc.fontSize(10).fillColor(SOFT).text(contact);
    }

    doc
      .fontSize(8)
      .fillColor(SOFT)
      .text(
        `Larkspur Realty  |  Generated ${new Date().toLocaleDateString('en-US')}`,
        50,
        doc.page.height - 60,
        { align: 'center', width },
      );
  });

// ---- admin summary report ----

export const summaryReportPDF = ({ overview, agents }) =>
  render((doc) => {
    doc.fontSize(20).fillColor(INK).text('Operations summary');
    doc.fontSize(9).fillColor(SOFT).text(new Date().toLocaleString('en-US'));
    doc.moveDown(1);

    const metrics = [
      ['Active listings', overview.activeListings],
      ['Sold or rented', overview.closed],
      ['Agents', overview.agents],
      ['New inquiries', overview.newInquiries],
      ['Pending approvals', overview.pendingApprovals],
      ['Upcoming viewings', overview.upcomingViewings],
      ['Lead conversion', `${overview.conversionRate}%`],
    ];
    doc.fontSize(11);
    for (const [label, value] of metrics) {
      const y = doc.y;
      doc.fillColor(SOFT).text(label, 50, y, { width: 220 });
      doc.fillColor(INK).text(String(value), 270, y);
      doc.moveDown(0.4);
    }

    doc.moveDown(1);
    doc.fontSize(13).fillColor(INK).text('Agent performance');
    doc.moveDown(0.4);
    doc.fontSize(9).fillColor(SOFT);
    const cols = [50, 230, 320, 400, 480];
    doc.text('Agent', cols[0], doc.y);
    doc.text('Published', cols[1], doc.y - 11);
    doc.text('Leads', cols[2], doc.y - 11);
    doc.text('Won', cols[3], doc.y - 11);
    doc.text('Viewings', cols[4], doc.y - 11);
    doc.moveDown(0.3);

    doc.fontSize(10).fillColor(INK);
    for (const a of agents) {
      const y = doc.y;
      doc.text(a.name, cols[0], y, { width: 170 });
      doc.text(String(a.published), cols[1], y);
      doc.text(String(a.leads), cols[2], y);
      doc.text(String(a.won), cols[3], y);
      doc.text(String(a.viewingsCompleted), cols[4], y);
      doc.moveDown(0.35);
    }
  });
