import React from 'react';
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
import { LuPlus, LuRefreshCw, LuTrash2, LuCheck, LuX, LuPencil, LuEye, LuSearch } from "react-icons/lu";
import { useEffect, useState } from "react";
import { medicalCertificatesService } from "../services/medicalCertificates";
import { membersService } from "../services/members";
import type { MedicalCertificateDTO, CreateMedicalCertificateRequest, MemberDTO } from "@alentapp/shared";
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

export function MedicalCertificateView() {
  const [certificates, setCertificates] = useState<MedicalCertificateDTO[]>([]);
  const [members, setMembers] = useState<MemberDTO[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Estados para el Modal flotante de Carga/Edición
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  // Estado para el Panel de Visualización Completa
  const [viewingCert, setViewingCert] = useState<MedicalCertificateDTO | null>(null);

  //  Estado para la barra de búsqueda
  const [searchTerm, setSearchTerm] = useState("");

  // Estado del formulario de texto
  const [formData, setFormData] = useState<CreateMedicalCertificateRequest>({
    member_id: "",
    issue_date: "",
    expiry_date: "",
    doctor_license: "",
    is_validated: true,
  });

  // Estados exclusivos para el archivo adjunto y su previsualización
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Colección dinámica para el selector de socios
  const membersCollection = createListCollection({
    items: members.map((m) => ({ label: `${m.name} (DNI: ${m.dni})`, value: m.id })),
  });

  const fetchData = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [certsData, membersData] = await Promise.all([
        medicalCertificatesService.getAll().catch(() => []),
        membersService.getAll()
      ]);
      setCertificates(certsData);
      setMembers(membersData);
    } catch (err: any) {
      setError(err.message || "Error al conectar con el servidor");
    } finally {
      setIsLoading(false);
    }
  };

  const openCreateModal = () => {
    setFormData({ 
      member_id: "", 
      issue_date: "", 
      expiry_date: "", 
      doctor_license: "", 
      is_validated: true 
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setEditingId(null);
    setIsDialogOpen(true);
  };

  const openEditModal = (cert: MedicalCertificateDTO) => {
    setFormData({
      member_id: cert.member_id,
      issue_date: cert.issue_date,
      expiry_date: cert.expiry_date,
      doctor_license: cert.doctor_license,
      is_validated: cert.is_validated,
    });
    setSelectedFile(null);
    setPreviewUrl(null);
    setEditingId(cert.id);
    setIsDialogOpen(true);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      setSelectedFile(file);

      if (file.type.startsWith("image/")) {
        setPreviewUrl(URL.createObjectURL(file));
      } else {
        setPreviewUrl(null);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      let base64File: string | null = null;

      if (selectedFile) {
        base64File = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.readAsDataURL(selectedFile);
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = (err) => reject(err);
        });
      }

      if (editingId) {
        await medicalCertificatesService.update(editingId, {
          ...formData,
          file_data: base64File,
        } as any);
      } else {
        await medicalCertificatesService.create({
          member_id: formData.member_id,
          issue_date: formData.issue_date,
          expiry_date: formData.expiry_date,
          doctor_license: formData.doctor_license,
          file_data: base64File,
        } as any);
      }

      setIsDialogOpen(false);
      fetchData();
    } catch (err: any) {
      alert(err.message || "Error al procesar el certificado");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleValidation = async (cert: MedicalCertificateDTO) => {
    try {
      await medicalCertificatesService.update(cert.id, {
        is_validated: !cert.is_validated,
      });
      fetchData();
    } catch (err: any) {
      alert(err.message || "Error al modificar la validación");
    }
  };

  const handleDeleteCertificate = async (id: string, memberName: string) => {
    if (window.confirm(`¿Estás seguro de que deseas eliminar el certificado del socio "${memberName}"? Esta acción aplicará un borrado físico.`)) {
      try {
        await medicalCertificatesService.delete(id);
        fetchData();
      } catch (err: any) {
        alert(err.message || "Error al eliminar el certificado");
      }
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const getMemberName = (memberId: string) => {
    const member = members.find((m) => m.id === memberId);
    return member ? member.name : "Socio no identificado";
  };

  //  Cruza los certificados con los datos del socio (Nombre o DNI)
  const filteredCertificates = certificates.filter((cert) => {
    const member = members.find((m) => m.id === cert.member_id);
    if (!member) return false;

    const textToSearch = searchTerm.toLowerCase();
    return (
      member.name.toLowerCase().includes(textToSearch) ||
      member.dni.toLowerCase().includes(textToSearch)
    );
  });

  return (
    <>
      {/* ========================================== */}
      {/*  Formulario de Registro / Edición */}
      {/* ========================================== */}
      <DialogRoot open={isDialogOpen} onOpenChange={(e) => setIsDialogOpen(e.open)}>
        <Stack gap="8">
          <Flex justify="space-between" align="center">
            <Stack gap="1">
              <Heading size="2xl" fontWeight="bold">Administración de Certificados Médicos</Heading>
              <Text color="fg.muted" fontSize="md">
                Gestiona la aptitud física de los socios, vencimientos y matrículas profesionales.
              </Text>
            </Stack>
            <HStack gap="3">
              <Button variant="outline" onClick={fetchData} disabled={isLoading}>
                <LuRefreshCw /> Actualizar
              </Button>
              <Button colorPalette="blue" size="md" onClick={openCreateModal}>
                <LuPlus /> Cargar Certificado
              </Button>
            </HStack>
          </Flex>

          <DialogContent>
            <form onSubmit={handleSubmit}>
              <DialogHeader>
                <DialogTitle>{editingId ? "Editar Certificado Médico" : "Registrar Certificado Médico"}</DialogTitle>
              </DialogHeader>
              <DialogBody>
                <Stack gap="4">
                  <Field label="Seleccionar Socio" required>
                    <SelectRoot 
                      collection={membersCollection} 
                      value={[formData.member_id]}
                      onValueChange={(e) => setFormData({ ...formData, member_id: e.value[0] })}
                      disabled={editingId !== null}
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

                  <HStack gap="4" width="full">
                    <Field label="Fecha de Emisión" required flex="1">
                      <Input 
                        type="date" 
                        value={formData.issue_date}
                        onChange={(e) => setFormData({ ...formData, issue_date: e.target.value })}
                        required
                      />
                    </Field>

                    <Field label="Fecha de Vencimiento" required flex="1">
                      <Input 
                        type="date" 
                        value={formData.expiry_date}
                        onChange={(e) => setFormData({ ...formData, expiry_date: e.target.value })}
                        required
                      />
                    </Field>
                  </HStack>

                  <Field label="Matrícula del Profesional" required>
                    <Input 
                      placeholder="Ej. MN 123456" 
                      value={formData.doctor_license}
                      onChange={(e) => setFormData({ ...formData, doctor_license: e.target.value })}
                      required
                    />
                  </Field>

                  <Field label="Adjuntar Comprobante (Opcional al editar)">
                    <Input 
                      type="file"
                      accept="image/*,application/pdf"
                      onChange={handleFileChange}
                      paddingTop="5px"
                      required={editingId === null}
                    />
                  </Field>

                  {previewUrl && (
                    <Box border="1px solid" borderColor="border.muted" borderRadius="lg" p="3" bg="bg.muted/20" maxW="250px" alignSelf="center">
                      <Text fontSize="xs" fontWeight="bold" color="fg.muted" mb="2">Vista previa:</Text>
                      <img src={previewUrl} alt="Preview" style={{ maxWidth: "100%", maxHeight: "150px", borderRadius: "6px", objectFit: "contain" }} />
                    </Box>
                  )}
                </Stack>
              </DialogBody>
              <DialogFooter>
                <DialogActionTrigger asChild>
                  <Button variant="outline">Cancelar</Button>
                </DialogActionTrigger>
                <Button type="submit" colorPalette="blue" loading={isSubmitting}>
                  {editingId ? "Guardar Cambios" : "Guardar Certificado"}
                </Button>
              </DialogFooter>
              <DialogCloseTrigger />
            </form>
          </DialogContent>
        </Stack>
      </DialogRoot>

      {/* ========================================== */}
      {/*  Panel de Visualización Completa  */}
      {/* ========================================== */}
      <DialogRoot open={viewingCert !== null} onOpenChange={(e) => !e.open && setViewingCert(null)}>
        <DialogContent size="lg">
          <DialogHeader>
            <DialogTitle>Auditoría de Certificado Médico</DialogTitle>
          </DialogHeader>
          <DialogBody>
            {viewingCert && (
              <Stack gap="5">
                <Box p="4" borderWidth="1px" borderRadius="xl" bg="bg.muted/20">
                  <Stack gap="3">
                    <Flex justify="space-between" borderBottom="1px solid" borderColor="border.muted" pb="2">
                      <Text fontWeight="bold">Socio:</Text>
                      <Text fontWeight="semibold" color="blue.600">{getMemberName(viewingCert.member_id)}</Text>
                    </Flex>
                    <Flex justify="space-between" borderBottom="1px solid" borderColor="border.muted" pb="2">
                      <Text fontWeight="bold">Matrícula Profesional:</Text>
                      <Text color="fg.emphasized">{viewingCert.doctor_license}</Text>
                    </Flex>
                    <Flex justify="space-between" borderBottom="1px solid" borderColor="border.muted" pb="2">
                      <Text fontWeight="bold">Vigencia Temporal:</Text>
                      <Text color="fg.muted">{viewingCert.issue_date} hasta {viewingCert.expiry_date}</Text>
                    </Flex>
                    <Flex justify="space-between" align="center" pt="1">
                      <Text fontWeight="bold">Estado de Cobertura:</Text>
                      <Box 
                        px="2.5" py="0.5" borderRadius="md" fontWeight="bold" fontSize="xs"
                        bg={viewingCert.is_validated ? 'green.50' : 'orange.50'} 
                        color={viewingCert.is_validated ? 'green.700' : 'orange.700'}
                      >
                        {viewingCert.is_validated ? "VALIDADO / VIGENTE" : "PENDIENTE / INACTIVO"}
                      </Box>
                    </Flex>
                  </Stack>
                </Box>

                <Box border="1px solid" borderColor="border.muted" borderRadius="xl" p="4" bg="bg.panel" overflow="hidden">
                  <Text fontWeight="bold" mb="3" fontSize="sm" color="fg.muted">Documento Digitalizado Adjunto:</Text>
                  { (viewingCert as any).file_data ? (
                    (viewingCert as any).file_data.startsWith("data:application/pdf") ? (
                      <object data={(viewingCert as any).file_data} type="application/pdf" width="100%" height="400px">
                        <Center p="4"><Text fontSize="sm">Tu navegador no puede previsualizar el PDF.</Text></Center>
                      </object>
                    ) : (
                      <Center>
                        <img 
                          src={(viewingCert as any).file_data} 
                          alt="Certificado Médico del Socio" 
                          style={{ maxWidth: "100%", maxHeight: "400px", borderRadius: "8px", objectFit: "contain" }} 
                        />
                      </Center>
                    )
                  ) : (
                    <Center h="150px" border="1px dashed" borderColor="border.muted" borderRadius="md">
                      <Text color="fg.muted" fontSize="sm">Este registro no posee una captura de archivo cargada.</Text>
                    </Center>
                  )}
                </Box>
              </Stack>
            )}
          </DialogBody>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewingCert(null)}>Cerrar Panel</Button>
          </DialogFooter>
          <DialogCloseTrigger />
        </DialogContent>
      </DialogRoot>

      {/* ========================================== */}
      {/* SECCIÓN DE BÚSQUEDA Y CONTENIDO            */}
      {/* ========================================== */}
      {error && (
        <Box p="4" mb="4" bg="red.50" color="red.700" borderRadius="md" border="1px solid" borderColor="red.200">
          <Text fontWeight="bold">Error:</Text>
          <Text>{error}</Text>
        </Box>
      )}

      {/* BARRA DE BÚSQUEDA  */}
      <Box mt="4" maxW="md">
        <Flex align="center" position="relative">
          <Box position="absolute" left="3" zIndex="1" color="fg.muted">
            <LuSearch size="18" />
          </Box>
          <Input 
            placeholder="Buscar por nombre o DNI de socio..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            size="md"
            pl="10" // Padding izquierdo para que el texto no pise al ícono 
            bg="bg.panel"
            borderRadius="lg"
            borderWidth="1px"
            _focus={{ borderColor: "blue.500", boxShadow: "0 0 0 1px #3182ce" }}
          />
        </Flex>
      </Box>

      {/* Tabla de Registros */}
      <Box bg="bg.panel" borderRadius="xl" boxShadow="sm" borderWidth="1px" overflow="hidden" minH="300px" mt="4">
        {isLoading ? (
          <Center h="300px"><Spinner size="xl" color="blue.500" /></Center>
        ) : certificates.length === 0 ? (
          <Center h="300px">
            <Stack align="center" gap="4">
              <Text color="fg.muted">No se encontraron certificados médicos registrados.</Text>
              <Button variant="ghost" onClick={fetchData}>Reintentar</Button>
            </Stack>
          </Center>
        ) : filteredCertificates.length === 0 ? (
          
          <Center h="300px">
            <Text color="fg.muted">No se encontraron socios que coincidan con "{searchTerm}".</Text>
          </Center>
        ) : (
          <Table.Root size="md" variant="line" interactive>
            <Table.Header>
              <Table.Row bg="bg.muted/50">
                <Table.ColumnHeader py="4">Socio</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Emisión</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Vencimiento</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Matrícula</Table.ColumnHeader>
                <Table.ColumnHeader py="4">Estado</Table.ColumnHeader>
                <Table.ColumnHeader py="4" textAlign="end">Acciones</Table.ColumnHeader>
              </Table.Row>
            </Table.Header>
            <Table.Body>
              {filteredCertificates.map((cert) => {
                const memberName = getMemberName(cert.member_id);
                return (
                  <Table.Row key={cert.id} _hover={{ bg: "bg.muted/30" }}>
                    <Table.Cell fontWeight="semibold" color="fg.emphasized">{memberName}</Table.Cell>
                    <Table.Cell color="fg.muted">{cert.issue_date}</Table.Cell>
                    <Table.Cell color="fg.muted">{cert.expiry_date}</Table.Cell>
                    <Table.Cell color="fg.muted">{cert.doctor_license}</Table.Cell>
                    <Table.Cell>
                      <Button 
                        size="xs" 
                        colorPalette={cert.is_validated ? "green" : "orange"}
                        variant={cert.is_validated ? "surface" : "outline"}
                        onClick={() => handleToggleValidation(cert)}
                      >
                        {cert.is_validated ? <LuCheck /> : <LuX />}
                        {cert.is_validated ? "Validado" : "Pendiente"}
                      </Button>
                    </Table.Cell>
                    <Table.Cell textAlign="end">
                      <HStack gap="2" justify="flex-end">
                        <IconButton 
                          variant="ghost" 
                          size="sm" 
                          colorPalette="green"
                          aria-label="Ver Detalles"
                          onClick={() => setViewingCert(cert)}
                        >
                          <LuEye />
                        </IconButton>
                        <IconButton 
                          variant="ghost" 
                          size="sm" 
                          colorPalette="blue"
                          aria-label="Editar Certificado"
                          onClick={() => openEditModal(cert)}
                        >
                          <LuPencil />
                        </IconButton>
                        <IconButton 
                          variant="ghost" 
                          size="sm" 
                          colorPalette="red"
                          aria-label="Eliminar Certificado"
                          onClick={() => handleDeleteCertificate(cert.id, memberName)}
                        >
                          <LuTrash2 />
                        </IconButton>
                      </HStack>
                    </Table.Cell>
                  </Table.Row>
                );
              })}
            </Table.Body>
          </Table.Root>
        )}
      </Box>
    </>
  );
}