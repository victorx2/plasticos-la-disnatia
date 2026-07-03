export const VENDOR_LABELS = {
  listTitle: "Vendedores",
  listSubtitle: "Equipo comercial asignable a clientes.",
  formNewTitle: "Nuevo vendedor",
  formEditTitle: "Editar vendedor",
  formSubtitle: "Nombre y teléfonos de contacto.",
  formFooterHint: "Indique al menos el nombre del vendedor.",
  sections: {
    identity: "Identificación",
    identityHint: "Nombre comercial del vendedor.",
    contact: "Contacto",
    contactHint: "Teléfonos para coordinación comercial.",
  },
  preview: {
    title: "Vista previa",
    hint: "Podrá asignar este vendedor a clientes en Datos maestros.",
  },
  validation: {
    name: "Indique el nombre del vendedor.",
    phone: "Teléfono inválido. Use solo números, espacios o guiones (7–15 dígitos).",
    summary: "Revise los campos marcados antes de guardar.",
  },
  searchLabel: "Buscar",
  searchPlaceholder: "Nombre o teléfono…",
  newVendor: "Nuevo vendedor",
  save: "Guardar",
  saving: "Guardando…",
  cancel: "Volver",
  tabs: {
    active: "Activos",
    inactive: "Desactivados",
  },
  status: {
    active: "Activo",
    inactive: "Inactivo",
  },
  actions: {
    deactivate: "Desactivar",
    activate: "Activar",
  },
  emptyTitle: "Sin vendedores",
  emptyInactiveTitle: "Sin vendedores desactivados",
  emptyFiltered: "Sin resultados",
  emptyDescription: "Crea el primero para asignarlo a tus clientes.",
  emptyInactiveDescription: "Los vendedores retirados del listado operativo aparecerán aquí.",
  emptyFilteredDescription: "Prueba otro término de búsqueda.",
  loadError: "No se pudo cargar la lista de vendedores.",
  saveError: "No se pudo guardar el vendedor.",
  saved: "Vendedor guardado.",
  savedEdit: "Vendedor actualizado.",
  loadOneError: "No se pudo cargar el vendedor.",
  toggleActivated: "Vendedor activado.",
  toggleDeactivated: "Vendedor desactivado.",
  toggleError: "No se pudo actualizar el estado del vendedor.",
  confirmDeactivateTitle: "¿Desactivar vendedor?",
  confirmDeactivateAction: "Desactivar",
  confirmCancel: "Cancelar",
  confirmDeactivateWithClients: (name: string, count: number) =>
    count === 1
      ? `«${name}» tiene 1 cliente asignado. Al desactivarlo seguirá asignado, pero no aparecerá al crear clientes nuevos.`
      : `«${name}» tiene ${count.toLocaleString("es-VE")} clientes asignados. Al desactivarlo seguirán asignados, pero no aparecerá al crear clientes nuevos.`,
  confirmDeactivateNoClients: (name: string) =>
    `¿Confirma desactivar a «${name}»? Ya no aparecerá en el listado operativo.`,
  fields: {
    name: "Nombre",
    phonePrimary: "Teléfono principal",
    phoneSecondary: "Teléfono secundario",
    status: "Estado",
    clients: "Clientes",
    created: "Creado",
  },
  table: {
    number: "N.º",
    clients: "Clientes",
    actions: "Acciones",
    edit: "Editar",
  },
  clientsCount: (n: number) =>
    n === 1 ? "1 cliente" : `${n.toLocaleString("es-VE")} clientes`,
  count: (n: number) =>
    n === 1 ? "1 vendedor" : `${n.toLocaleString("es-VE")} vendedores`,
} as const
