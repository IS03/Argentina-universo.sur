// Presentation utility only: approved public names/anchors, no persistence or itinerary inference.
export interface VisitPlanDestination {
  name: string;
  canonical: string;
  attractions: { id: string; name: string }[];
}
export function selectedAttractions(destination: VisitPlanDestination, selectedIds: readonly string[]) {
  const selected = new Set(selectedIds);
  return destination.attractions.filter(item => selected.has(item.id));
}
export function visitList(destination: VisitPlanDestination, selectedIds: readonly string[]) {
  const selected = selectedAttractions(destination, selectedIds);
  if (!selected.length) return '';
  return [
    `${destination.name} — Mi selección`, '',
    ...selected.flatMap(item => [`• ${item.name}`, `${destination.canonical}#${encodeURIComponent(item.id)}`, '']),
    `Ficha completa: ${destination.canonical}`, '',
    'Lista de lugares, sin orden de visita, horarios ni disponibilidad confirmados.',
  ].join('\n');
}
