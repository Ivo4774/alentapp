import { 
  Table, 
  Button, 
  Heading, 
  HStack, 
  IconButton, 
  Stack, 
  Text, 
  Box,
  Flex,
  Spinner,
  Center,
  Input
} from "@chakra-ui/react";
import { LuPlus, LuPencil, LuTrash2, LuRefreshCw } from "react-icons/lu";
import { useEffect, useState } from "react";
import { lockersService } from "../services/lockers";
import { membersService } from "../services/members";
import type { LockerDTO, CreateLockerRequest, UpdateLockerRequest, LockerStatus, MemberDTO } from "@alentapp/shared";
import { 
  DialogRoot, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogBody, 
  DialogFooter, 
  DialogActionTrigger,
  DialogCloseTrigger
} from "../components/ui/dialog";
import { Field } from "../components/ui/field";

export function LockersView() {
  const [lockers, setLockers] = useState<LockerDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for the modal
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingLockerId, setEditingLockerId] = useState<string | null>(null);

  // Form state
  const [formData, setFormData] = useState<any>({
    number: 0,
    location: "",
    status: "Available",
    member_id: null
  });

  const fetchLockers = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await lockersService.getAll();
      setLockers(data);
    } catch (err: any) {
      // Como el GET todavía no está en el backend, no queremos que rompa la pantalla
      console.warn("Aún no se implementó el GET en el backend", err);
      setLockers([]);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchMembers = async () => {
    try {
      // Reutilizamos tu servicio existente
      const data = await membersService.getAll();
      setMembers(data);
    } catch (err: any) {
      console.error("Error al cargar la lista de socios", err);
    }
  };

  const openCreateModal = () => {
    setEditingLockerId(null);
    setFormData({ number: "" as any, location: "" }); 
    setIsDialogOpen(true);
  };

  const openEditModal = (locker: LockerDTO) => {
    setEditingLockerId(locker.id);
    setFormData({
      number: locker.number,
      location: locker.location,
      status: locker.status, // En TDD-0011 permitimos cambiar estado
      member_id: locker.member_id
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      if (editingLockerId) {
        // 1. Armamos los datos forzando a que el número sea un número real (Int)
        const updatePayload: UpdateLockerRequest = {
            ...formData,
            number: parseInt(formData.number.toString(), 10)
        };

        await lockersService.update(editingLockerId, updatePayload);
        
        // Recargamos la lista fresca desde el backend
        fetchLockers();
      } else {
        const payload: CreateLockerRequest = {
            number: parseInt(formData.number.toString(), 10),
            location: formData.location
        };
        await lockersService.create(payload);
        fetchLockers(); // Para el alta seguimos haciendo fetch completo
      }
      setIsDialogOpen(false);
    } catch (err: any) {
      alert(err.message || "Error al guardar el casillero");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteLocker = async (id: string, number: number) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el casillero #${number}?`)) {
      try {
        await lockersService.delete(id);
        fetchLockers();
      } catch (err: any) {
        alert(err.message || "Error al eliminar el casillero");
      }
    }
  };

  useEffect(() => {
    fetchLockers();
    fetchMembers();
  }, []);

  // Función para obtener colores según el estado del locker
  const getStatusColor = (status: LockerStatus) => {
    switch (status) {
        case 'Available': return { bg: 'green.50', color: 'green.700', label: 'Disponible' };
        case 'Occupied': return { bg: 'red.50', color: 'red.700', label: 'Ocupado' };
        case 'Maintenance': return { bg: 'orange.50', color: 'orange.700', label: 'Mantenimiento' };
        default: return { bg: 'gray.50', color: 'gray.700', label: status };
    }
  };

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Administración de Lockers</Heading>
            <Text color="fg.muted" fontSize="md">
              Gestiona los casilleros del club y su asignación.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={fetchLockers} disabled={isLoading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Agregar Casillero
            </Button>
          </HStack>
        </Flex>

        {/* Modal para agregar casillero */}
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>{editingLockerId ? "Editar Casillero" : "Agregar Nuevo Casillero"}</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Número de Casillero" required>
                  <Input 
                    type="number"
                    placeholder="Ej. 15" 
                    value={formData.number}
                    onChange={(e) => setFormData({ ...formData, number: Number(e.target.value) })}
                    required
                  />
                </Field>
                <Field label="Ubicación / Pasillo" required>
                  <Input 
                    placeholder="Ej. Vestuario Principal" 
                    value={formData.location}
                    onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                    required
                  />
                </Field>
                {/* Renderizado condicional: Solo mostramos el estado si estamos editando */}
                {editingLockerId && (
                  <Field label="Estado del Casillero" required>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid #3f444e", // Combina con las sutiles líneas de Chakra v3
                        background: "#18181b",       // Mantiene el fondo oscuro del modal
                        color: "white",
                        fontSize: "14px",
                        outline: "none"
                      }}
                    >
                      <option value="Available" style={{ background: "#18181b" }}>Disponible</option>
                      <option value="Occupied" style={{ background: "#18181b" }}>Ocupado</option>
                      <option value="Maintenance" style={{ background: "#18181b" }}>Mantenimiento</option>
                    </select>
                  </Field>
                )}
                {/* Renderizado condicional: Si está editando Y elije "Ocupado", elije socio obligatoriamente */}
                {editingLockerId && formData.status === 'Occupied' && (
                  <Field label="Asignar Socio (Obligatorio)" required>
                    <select
                      value={formData.member_id || ""}
                      onChange={(e) => setFormData({ ...formData, member_id: e.target.value || null })}
                      required
                      style={{
                        width: "100%",
                        padding: "10px",
                        borderRadius: "6px",
                        border: "1px solid #3f444e",
                        background: "#18181b",
                        color: "white",
                        fontSize: "14px",
                        outline: "none"
                      }}
                    >
                      <option value="" style={{ background: "#18181b" }}>-- Seleccionar Socio --</option>
                      {members.map((member) => (
                        <option key={member.id} value={member.id} style={{ background: "#18181b" }}>
                          {member.name} (DNI: {member.dni})
                        </option>
                      ))}
                    </select>
                  </Field>
                )}
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                {editingLockerId ? "Guardar Cambios" : "Crear Casillero"}
                </Button>
            </DialogFooter>
            <DialogCloseTrigger />
          </form>
        </DialogContent>

        {error && (
          <Box p="4" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
            <Text fontWeight="bold">Error:</Text>
            <Text>{error}</Text>
          </Box>
        )}

        <Box 
          bg="bg.panel" 
          borderRadius="xl" 
          boxShadow="sm" 
          borderWidth="1px" 
          overflow="hidden"
          minH="300px"
          position="relative"
        >
          {isLoading ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Spinner size="xl" color="blue.500" />
                <Text color="fg.muted">Cargando casilleros...</Text>
              </Stack>
            </Center>
          ) : lockers.length === 0 ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Text color="fg.muted">No se encontraron casilleros.</Text>
              </Stack>
            </Center>
          ) : (
            <Table.Root size="md" variant="line" interactive>
              <Table.Header>
                <Table.Row bg="bg.muted/50">
                  <Table.ColumnHeader py="4">Número</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Ubicación</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Estado</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Miembro Asignado</Table.ColumnHeader>
                  <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {lockers.map((locker) => {
                  const statusInfo = getStatusColor(locker.status);
                  const assignedMember = members.find(
                  m => String(m.id).trim() === String(locker.member_id).trim()
                );
                console.log(`Locker #${locker.number} - member_id del locker: "${locker.member_id}" | Socio encontrado:`, assignedMember);
                  return (
                  <Table.Row key={locker.id} _hover={{ bg: "bg.muted/30" }}>
                    <Table.Cell fontWeight="bold" color="fg.emphasized">
                      #{locker.number}
                    </Table.Cell>
                    <Table.Cell color="fg.muted">{locker.location}</Table.Cell>
                    <Table.Cell>
                      <Box 
                        display="inline-block" 
                        px="2" 
                        py="0.5" 
                        borderRadius="md" 
                        bg={statusInfo.bg} 
                        color={statusInfo.color} 
                        fontSize="xs" 
                        fontWeight="bold"
                      >
                        {statusInfo.label}
                      </Box>
                    </Table.Cell>
                    <Table.Cell>
                      {assignedMember ? assignedMember.name : "—"}
                    </Table.Cell>
                    <Table.Cell textAlign="end">
                      <HStack gap="2" justify="flex-end">
                        {/* BOTÓN DE EDITAR QUE AGREGAMOS */}
                        <IconButton 
                          variant="ghost" 
                          size="sm" 
                          aria-label="Editar casillero"
                          onClick={() => openEditModal(locker)}
                        >
                          <LuPencil />
                        </IconButton>
                        <IconButton 
                          variant="ghost" 
                          size="sm" 
                          colorPalette="red" 
                          aria-label="Eliminar casillero"
                          onClick={() => handleDeleteLocker(locker.id, locker.number)}
                        >
                          <LuTrash2 />
                        </IconButton>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                )})}
              </Table.Body>
            </Table.Root>
          )}
        </Box>
      </Stack>
    </DialogRoot>
  );
}