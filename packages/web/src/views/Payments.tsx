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
import { LuPlus, LuRefreshCw, LuBan } from "react-icons/lu";
import { useEffect, useState } from "react";
import { paymentsService } from "../services/payments";
import { membersService } from "../services/members";
import type { PaymentDTO, CreatePaymentRequest, MemberDTO, PaymentStatus } from "@alentapp/shared";
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
import { 
  SelectRoot, 
  SelectTrigger, 
  SelectValueText, 
  SelectContent, 
  SelectItem, 
  createListCollection 
} from "../components/ui/select";

// Configuración de los meses para el Selector
const monthsCollection = createListCollection({
  items: Array.from({ length: 12 }, (_, i) => ({ label: `${i + 1}`, value: `${i + 1}` })),
});

export function PaymentsView() {
  const [payments, setPayments] = useState<PaymentDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // State for the modal
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form state basado en CreatePaymentRequest
  const [formData, setFormData] = useState<CreatePaymentRequest>({
    amount: 0,
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    due_date: "",
    member_id: "",
  });

  // Generamos dinámicamente la lista de socios cargados para el select
  const membersCollection = createListCollection({
    items: members.map((m) => ({ label: `${m.name} (DNI: ${m.dni})`, value: m.id })),
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      // Cargamos pagos y miembros de manera simultánea
      const [paymentsData, membersData] = await Promise.all([
        paymentsService.getAll(),
        membersService.getAll()
      ]);
      setPayments(paymentsData);
      setMembers(membersData);
    } catch (err: any) {
      setError(err.message || "Error al cargar los datos de tesorería");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({ 
      amount: 0, 
      month: new Date().getMonth() + 1, 
      year: new Date().getFullYear(), 
      due_date: "", 
      member_id: "" 
    });
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      await paymentsService.create({
        ...formData,
        amount: Number(formData.amount),
        month: Number(formData.month),
        year: Number(formData.year),
      });
      setIsDialogOpen(false);
      fetchData(); // Refresh list
    } catch (err: any) {
      alert(err.message || "Error al registrar el cobro");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelPayment = async (id: string) => {
    if (window.confirm("¿Estás seguro de que deseas anular este comprobante de pago?")) {
      try {
        await paymentsService.cancel(id);
        fetchData();
      } catch (err: any) {
        alert(err.message || "Error al anular el pago");
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Función auxiliar para obtener el nombre del socio en la tabla
  const getMemberName = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    return member ? member.name : "Socio no identificado";
  };

  return (
    <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
      <Stack gap="8">
        <Flex justify="space-between" align="center">
          <Stack gap="1">
            <Heading size="2xl" fontWeight="bold">Tesorería y Control de Pagos</Heading>
            <Text color="fg.muted" fontSize="md">
              Generá deudas y registrá los comprobantes digitales de las cuotas del club.
            </Text>
          </Stack>
          <HStack gap="3">
            <Button variant="outline" onClick={fetchData} disabled={isLoading}>
              <LuRefreshCw /> Actualizar
            </Button>
            <Button colorPalette="blue" size="md" onClick={openCreateModal}>
              <LuPlus /> Generar Pago
            </Button>
          </HStack>
        </Flex>

        {/* Modal para registrar un pago nuevo */}
        <DialogContent>
          <form onSubmit={handleSubmit}>
            <DialogHeader>
              <DialogTitle>Registrar Nueva Cuota / Deuda</DialogTitle>
            </DialogHeader>
            <DialogBody>
              <Stack gap="4">
                <Field label="Seleccionar Socio" required>
                  <SelectRoot 
                    collection={membersCollection} 
                    value={[formData.member_id]}
                    onValueChange={(e) => setFormData({ ...formData, member_id: e.value[0] })}
                  >
                    <SelectTrigger>
                      <SelectValueText placeholder="Busque y seleccione un socio" />
                    </SelectTrigger>
                    <SelectContent>
                      {membersCollection.items.map((member) => (
                        <SelectItem item={member} key={member.value}>
                          {member.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </SelectRoot>
                </Field>

                <Field label="Monto de la Cuota ($)" required>
                  <Input 
                    type="number"
                    min="1"
                    placeholder="Ej. 15000" 
                    value={formData.amount || ""}
                    onChange={(e) => setFormData({ ...formData, amount: Number(e.target.value) })}
                    required
                  />
                </Field>

                <HStack gap="4" width="full">
                  <Field label="Mes de Referencia" required flex="1">
                    <SelectRoot 
                      collection={monthsCollection} 
                      value={[String(formData.month)]}
                      onValueChange={(e) => setFormData({ ...formData, month: Number(e.value[0]) })}
                    >
                      <SelectTrigger>
                        <SelectValueText placeholder="Mes" />
                      </SelectTrigger>
                      <SelectContent>
                        {monthsCollection.items.map((m) => (
                          <SelectItem item={m} key={m.value}>
                            Mes {m.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </SelectRoot>
                  </Field>

                  <Field label="Año" required flex="1">
                    <Input 
                      type="number"
                      placeholder="Ej. 2026" 
                      value={formData.year || ""}
                      onChange={(e) => setFormData({ ...formData, year: Number(e.target.value) })}
                      required
                    />
                  </Field>
                </HStack>

                <Field label="Fecha de Vencimiento" required>
                  <Input 
                    type="date" 
                    value={formData.due_date}
                    onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
                    required
                  />
                </Field>
              </Stack>
            </DialogBody>
            <DialogFooter>
              <DialogActionTrigger asChild>
                <Button variant="outline">Cancelar</Button>
              </DialogActionTrigger>
              <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                Emitir Comprobante
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
                <Text color="fg.muted">Cargando comprobantes...</Text>
              </Stack>
            </Center>
          ) : payments.length === 0 ? (
            <Center h="300px">
              <Stack align="center" gap="4">
                <Text color="fg.muted">No se encontraron registros de cobros o deudas.</Text>
                <Button variant="ghost" onClick={fetchData}>Reintentar</Button>
              </Stack>
            </Center>
          ) : (
            <Table.Root size="md" variant="line" interactive>
              <Table.Header>
                <Table.Row bg="bg.muted/50">
                  <Table.ColumnHeader py="4">Socio</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Monto</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Período</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Vencimiento</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Fecha de Pago</Table.ColumnHeader>
                  <Table.ColumnHeader py="4">Estado</Table.ColumnHeader>
                  <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
                </Table.Row>
              </Table.Header>
              <Table.Body>
                {payments.map((payment) => (
                  <Table.Row key={payment.id} _hover={{ bg: "bg.muted/30" }}>
                    <Table.Cell fontWeight="semibold" color="fg.emphasized">
                      {getMemberName(payment.member_id)}
                    </Table.Cell>
                    <Table.Cell color="fg.muted" fontWeight="bold">${payment.amount}</Table.Cell>
                    <Table.Cell color="fg.muted">{payment.month}/{payment.year}</Table.Cell>
                    <Table.Cell color="fg.muted">{payment.due_date}</Table.Cell>
                    <Table.Cell color="fg.muted">{payment.payment_date || "-"}</Table.Cell>
                    <Table.Cell>
                      <Box 
                        display="inline-block" 
                        px="2" 
                        py="0.5" 
                        borderRadius="md" 
                        bg={
                          payment.status === 'Paid' ? 'green.50' : 
                          payment.status === 'Pending' ? 'orange.50' : 'red.50'
                        } 
                        color={
                          payment.status === 'Paid' ? 'green.700' : 
                          payment.status === 'Pending' ? 'orange.700' : 'red.700'
                        } 
                        fontSize="xs" 
                        fontWeight="bold"
                      >
                        {payment.status}
                      </Box>
                    </Table.Cell>
                    <Table.Cell textAlign="end">
                      <HStack gap="2" justify="flex-end">
                        {payment.status !== 'Canceled' && (
                          <IconButton 
                            variant="ghost" 
                            size="sm" 
                            colorPalette="red"
                            aria-label="Anular Comprobante"
                            onClick={() => handleCancelPayment(payment.id)}
                          >
                            <LuBan />
                          </IconButton>
                        )}
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                ))}
              </Table.Body>
            </Table.Root>
          )}
        </Box>
      </Stack>
    </DialogRoot>
  );
}