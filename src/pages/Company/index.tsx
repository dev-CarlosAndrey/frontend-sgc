import {
  Title,
  Text,
  Paper,
  Group,
  Button,
  TextInput,
  Grid,
  Stack,
  ThemeIcon,
  Switch,
  Tabs,
  Loader,
  Center,
  Image,
  Overlay,
} from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import {
  IconUpload,
  IconBuilding,
  IconMapPin,
  IconPlus,
  IconBuildingBank,
  IconPencil,
} from "@tabler/icons-react";
import { useState, useEffect, useCallback, useRef } from "react";
import { api } from "../../services/api";
import { useAuth } from "../../hooks/useAuth";
import { CompanyModal } from "./components/CompanyModal";
import styles from "./Company.module.css";
import { alertApiError } from '../../utils/apiError';

// URL base do backend (sem o prefixo /api/v1) usada para resolver caminhos relativos de arquivos estáticos (ex.: logos)
const API_ORIGIN = "http://localhost:8080";

const resolveAssetUrl = (url?: string) => {
  if (!url) return undefined;
  if (/^https?:\/\//i.test(url)) return url;
  return `${API_ORIGIN}${url.startsWith("/") ? "" : "/"}${url}`;
};

const LOGO_MAX_SIZE_BYTES = 2 * 1024 * 1024;
const ACCEPTED_LOGO_TYPES = ["image/png", "image/jpeg", "image/svg+xml"];

// 1. Tipagem atualizada incluindo as contagens do DTO
interface Company {
  id: number;
  companyName: string;
  cnpj: string;
  email: string;
  phone: string;
  logoUrl?: string | null;
  active: boolean;
  totalBuildings: number;
  totalSectors: number;
}

export function CompanyScreen() {
  const { user } = useAuth();
  const isAdmin = user?.role === "ADMIN";

  const [modalOpened, { open: openModal, close: closeModal }] =
    useDisclosure(false);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [selectedTab, setSelectedTab] = useState<string | null>(null);

  // Estado do Formulário Atual
  const [currentCompanyId, setCurrentCompanyId] = useState<number | null>(null);
  const [companyName, setCompanyName] = useState("");
  const [cnpj, setCnpj] = useState("");
  const [corporateEmail, setCorporateEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [isUnitActive, setIsUnitActive] = useState(true);
  const [logoUrl, setLogoUrl] = useState<string | null | undefined>(undefined);

  // Estados para as contagens dinâmicas
  const [totalBuildings, setTotalBuildings] = useState<number>(0);
  const [totalSectors, setTotalSectors] = useState<number>(0);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Busca lista de empresas
  const fetchCompanies = useCallback(async (selectId?: number) => {
    try {
      setLoading(true);
      const response = await api.get("/companies?size=1000");
      const data: Company[] = response.data.content
        ? response.data.content
        : response.data;
      setCompanies(data);

      if (data.length > 0) {
        const targetId = selectId || data[0].id;
        setSelectedTab(String(targetId));
        fillForm(data.find((c) => c.id === targetId) || data[0]);
      }
    } catch (error) {
      console.error("Erro ao buscar empresas:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCompanies();
  }, [fetchCompanies]);

  // Preenche formulário ao alternar a aba
  const fillForm = (company: Company) => {
    setCurrentCompanyId(company.id);
    setCompanyName(company.companyName);
    setCnpj(company.cnpj);
    setCorporateEmail(company.email);
    setPhone(company.phone);
    setIsUnitActive(company.active);
    setLogoUrl(company.logoUrl);

    // Atualiza as contagens dinâmicas no estado
    setTotalBuildings(company.totalBuildings ?? 0);
    setTotalSectors(company.totalSectors ?? 0);
  };

  const handleTabChange = (val: string | null) => {
    setSelectedTab(val);
    const selected = companies.find((c) => String(c.id) === val);
    if (selected) fillForm(selected);
  };

  // Salvar Alterações da Empresa Selecionada
  const handleSaveChanges = async () => {
    if (!currentCompanyId) return;

    try {
      setSaving(true);
      await api.put(`/companies/${currentCompanyId}`, {
        companyName,
        cnpj,
        email: corporateEmail,
        phone,
        active: isUnitActive,
      });

      await fetchCompanies(currentCompanyId);
      alert("Alterações da instituição salvas com sucesso!");
    } catch (error) {
      alertApiError(error, "Erro ao salvar as alterações da empresa.");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoClick = () => {
    if (!isAdmin || !currentCompanyId || uploadingLogo) return;
    fileInputRef.current?.click();
  };

  const handleLogoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = ""; // permite selecionar o mesmo arquivo novamente em seguida

    if (!file || !currentCompanyId) return;

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      alert("Formato inválido. Envie um arquivo PNG, JPG ou SVG.");
      return;
    }
    if (file.size > LOGO_MAX_SIZE_BYTES) {
      alert("Arquivo muito grande. O tamanho máximo é 2MB.");
      return;
    }

    const formData = new FormData();
    formData.append("file", file);

    try {
      setUploadingLogo(true);
      const response = await api.post(`/companies/${currentCompanyId}/logo`, formData);
      setLogoUrl(response.data.logoUrl ?? response.data.url ?? null);
      await fetchCompanies(currentCompanyId);
    } catch (error) {
      alertApiError(error, "Erro ao enviar a logo. Tente novamente.");
    } finally {
      setUploadingLogo(false);
    }
  };

  if (loading && companies.length === 0) {
    return (
      <Center style={{ height: "60vh" }}>
        <Loader size="lg" />
      </Center>
    );
  }

  return (
    <Stack gap="lg">
      {isAdmin && (
        <CompanyModal
          opened={modalOpened}
          onClose={closeModal}
          onSuccess={(newId) => fetchCompanies(newId)}
        />
      )}

      {/* 1. CABEÇALHO PRINCIPAL */}
      <Group justify="space-between" align="center">
        <Title order={2} fw={700}>
          Configurações da Instituição
        </Title>
        {isAdmin && (
          <Group>
            <Button
              color="blue.6"
              radius="md"
              leftSection={<IconPlus size={18} color="#ffffff" />}
              onClick={openModal}
              c="white"
            >
              Nova Empresa
            </Button>

            <Button
              radius="md"
              color={!currentCompanyId ? "gray.3" : "blue.6"}
              onClick={handleSaveChanges}
              loading={saving}
              disabled={!currentCompanyId}
              c={!currentCompanyId ? "dark.8" : "white"}
            >
              Salvar Alterações
            </Button>
          </Group>
        )}
      </Group>

      {/* 2. ALTERNADOR DE ABAS (EMPRESAS) */}
      {companies.length > 0 ? (
        <Tabs
          value={selectedTab}
          onChange={handleTabChange}
          variant="outline"
          radius="md"
        >
          <Tabs.List mb="md">
            {companies.map((comp) => (
              <Tabs.Tab
                key={comp.id}
                value={String(comp.id)}
                leftSection={<IconBuildingBank size={16} />}
                style={{ fontWeight: 600 }}
              >
                {comp.companyName}
              </Tabs.Tab>
            ))}
          </Tabs.List>

          <Tabs.Panel value={selectedTab || ""}>
            {/* FORMULÁRIO PRINCIPAL: DADOS E LOGO */}
            <Paper p="xl" radius="md" withBorder>
              <Grid columns={12} gap="xl">
                {/* Inputs de Texto */}
                <Grid.Col span={{ base: 12, md: 8 }}>
                  <Stack gap="md">
                    <Text fw={700} size="md" mb={4}>
                      Dados da Empresa
                    </Text>

                    <TextInput
                      label="NOME EMPRESARIAL"
                      placeholder="Razão Social da empresa"
                      value={companyName}
                      onChange={(e) => setCompanyName(e.currentTarget.value)}
                      disabled={!isAdmin}
                      radius="md"
                      styles={{
                        label: {
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#868e96",
                          marginBottom: "6px",
                        },
                      }}
                    />

                    <TextInput
                      label="CNPJ"
                      placeholder="00.000.000/0000-00"
                      value={cnpj}
                      onChange={(e) => setCnpj(e.currentTarget.value)}
                      disabled={!isAdmin}
                      radius="md"
                      styles={{
                        label: {
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#868e96",
                          marginBottom: "6px",
                        },
                      }}
                    />

                    <TextInput
                      label="E-MAIL CORPORATIVO"
                      placeholder="email@empresa.com"
                      value={corporateEmail}
                      onChange={(e) => setCorporateEmail(e.currentTarget.value)}
                      disabled={!isAdmin}
                      radius="md"
                      styles={{
                        label: {
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#868e96",
                          marginBottom: "6px",
                        },
                      }}
                    />

                    <TextInput
                      label="TELEFONE"
                      placeholder="(00) 0000-0000"
                      value={phone}
                      onChange={(e) => setPhone(e.currentTarget.value)}
                      disabled={!isAdmin}
                      radius="md"
                      styles={{
                        label: {
                          fontSize: "11px",
                          fontWeight: 700,
                          color: "#868e96",
                          marginBottom: "6px",
                        },
                      }}
                    />
                  </Stack>
                </Grid.Col>

                {/* Área Dropzone/Upload do Logo */}
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Stack gap="sm" h="100%">
                    <Text
                      fw={700}
                      size="xs"
                      c="dimmed"
                      style={{ fontSize: "11px" }}
                    >
                      LOGO DA EMPRESA
                    </Text>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/png,image/jpeg,image/svg+xml"
                      style={{ display: "none" }}
                      onChange={handleLogoChange}
                    />
                    <Paper
                      withBorder
                      radius="md"
                      onClick={handleLogoClick}
                      className={logoUrl ? styles.logoBox : undefined}
                      style={{
                        position: "relative",
                        overflow: "hidden",
                        borderStyle: logoUrl ? "solid" : "dashed",
                        borderWidth: "1.5px",
                        display: "flex",
                        flexDirection: "column",
                        alignItems: "center",
                        justifyContent: "center",
                        flex: 1,
                        minHeight: "220px",
                        cursor: currentCompanyId ? "pointer" : "default",
                        backgroundColor: "#fafafa",
                      }}
                    >
                      {logoUrl ? (
                        <>
                          <Image
                            src={resolveAssetUrl(logoUrl)}
                            alt="Logo da empresa"
                            fit="contain"
                            w="100%"
                            h="100%"
                            p="md"
                          />
                          <Overlay
                            color="#000"
                            backgroundOpacity={0}
                            style={{
                              display: "flex",
                              flexDirection: "column",
                              alignItems: "center",
                              justifyContent: "center",
                              opacity: 0,
                              transition: "opacity 150ms ease",
                            }}
                            className={styles.logoOverlay}
                          >
                            <ThemeIcon variant="filled" color="blue.6" size={40} radius="xl">
                              <IconPencil size={20} stroke={1.5} />
                            </ThemeIcon>
                            <Text size="xs" fw={600} c="white" mt={6}>
                              Alterar logo
                            </Text>
                          </Overlay>
                        </>
                      ) : (
                        <>
                          <ThemeIcon
                            variant="subtle"
                            color="blue.6"
                            size={48}
                            radius="xl"
                          >
                            <IconUpload size={26} stroke={1.5} />
                          </ThemeIcon>
                          <Text size="sm" fw={600} mt="sm">
                            Clique para fazer upload
                          </Text>
                          <Text size="xs" c="dimmed" mt={4} ta="center" px="md">
                            PNG, JPG ou SVG <br /> Max 2MB
                          </Text>
                        </>
                      )}

                      {uploadingLogo && (
                        <Overlay color="#fff" backgroundOpacity={0.7} center>
                          <Loader size="sm" />
                        </Overlay>
                      )}
                    </Paper>
                  </Stack>
                </Grid.Col>
              </Grid>
            </Paper>

            {/* RESUMO DA ESTRUTURA */}
            <Stack gap="sm" mt="lg">
              <Text fw={700} size="md">
                Resumo da Estrutura
              </Text>

              <Grid columns={12} gap="md">
                {/* Card: Total de Prédios (AGORA DINÂMICO) */}
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Paper p="lg" radius="md" withBorder>
                    <Group gap="md">
                      <ThemeIcon
                        color="blue.0"
                        c="blue.6"
                        size={40}
                        radius="md"
                      >
                        <IconBuilding size={20} stroke={1.5} />
                      </ThemeIcon>
                      <Stack gap={0}>
                        <Text size="xs" c="dimmed" fw={700}>
                          TOTAL DE PRÉDIOS VINCULADOS
                        </Text>
                        <Text
                          fw={700}
                          size="xl"
                          style={{
                            fontSize: "28px",
                            lineHeight: 1.2,
                            marginTop: "4px",
                          }}
                        >
                          {totalBuildings}
                        </Text>
                      </Stack>
                    </Group>
                  </Paper>
                </Grid.Col>

                {/* Card: Total de Setores (AGORA DINÂMICO) */}
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Paper p="lg" radius="md" withBorder>
                    <Group gap="md">
                      <ThemeIcon
                        color="teal.0"
                        c="teal.6"
                        size={40}
                        radius="md"
                      >
                        <IconMapPin size={20} stroke={1.5} />
                      </ThemeIcon>
                      <Stack gap={0}>
                        <Text size="xs" c="dimmed" fw={700}>
                          TOTAL DE SETORES
                        </Text>
                        <Text
                          fw={700}
                          size="xl"
                          style={{
                            fontSize: "28px",
                            lineHeight: 1.2,
                            marginTop: "4px",
                          }}
                        >
                          {totalSectors}
                        </Text>
                      </Stack>
                    </Group>
                  </Paper>
                </Grid.Col>

                {/* Card: Status da Unidade */}
                <Grid.Col span={{ base: 12, md: 4 }}>
                  <Paper p="lg" radius="md" withBorder>
                    <Group justify="space-between" align="center">
                      <Stack gap={0}>
                        <Text size="xs" c="dimmed" fw={700}>
                          STATUS DA UNIDADE
                        </Text>
                        <Text fw={700} size="md" mt={4}>
                          {isUnitActive ? "Ativa" : "Inativa"}
                        </Text>
                        <Group gap={6} mt={6}>
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: "50%",
                              backgroundColor: isUnitActive
                                ? "#40c057"
                                : "#fa5252",
                            }}
                          />
                          <Text
                            size="xs"
                            c={isUnitActive ? "green.6" : "red.6"}
                            fw={500}
                          >
                            {isUnitActive
                              ? "Operando normalmente"
                              : "Desativada"}
                          </Text>
                        </Group>
                      </Stack>
                      <Switch
                        size="md"
                        checked={isUnitActive}
                        disabled={!isAdmin}
                        onChange={(event) =>
                          setIsUnitActive(event.currentTarget.checked)
                        }
                      />
                    </Group>
                  </Paper>
                </Grid.Col>
              </Grid>
            </Stack>
          </Tabs.Panel>
        </Tabs>
      ) : (
        <Paper p="xl" radius="md" withBorder style={{ textAlign: "center" }}>
          <Text c="dimmed" mb="md">
            Nenhuma instituição cadastrada.
          </Text>
          {isAdmin && (
            <Button color="blue.6" onClick={openModal}>
              Cadastrar Primeira Empresa
            </Button>
          )}
        </Paper>
      )}
    </Stack>
  );
}