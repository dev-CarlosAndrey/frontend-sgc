// src/components/Layout/index.tsx
import { AppShell, NavLink, Title, Text, Avatar, Group, ScrollArea } from '@mantine/core';
import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';
import {
  IconLayoutDashboard,
  IconBuilding,
  IconHierarchy,
  IconFolders,
  IconUsers,
  IconCertificate,
  IconPackage,
  IconBarcode,
  IconShoppingBag,
  IconFiles,
  IconReplace,
  IconFileText,
  IconLogout,
  IconBox,
  IconTags,
  IconUserCog,
  IconHistory
} from '@tabler/icons-react';

export function AppLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isAdmin = user?.role === 'ADMIN';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const compactNavLinkStyles = {
    borderRadius: 6,
    paddingTop: 8,    
    paddingBottom: 8, 
  };

  // Funções auxiliares para saber se um grupo deve iniciar expandido
  const isPhysicalStructureActive = ['/company', '/physical-structure', '/sectors'].includes(location.pathname);
  const isAssetsCatalogActive = ['/assets', '/asset-categories', '/products', '/brands', '/materials'].includes(location.pathname);

  return (
    <AppShell
      navbar={{
        width: 260,
        breakpoint: 0,
      }}
      padding="xl"
    >
      {/* BARRA LATERAL ORGANIZADA */}
      <AppShell.Navbar p="md" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
        
        {/* Topo da Sidebar: Branding */}
        <div style={{ paddingBottom: 18, paddingLeft: 8, borderBottom: '1px solid #f1f3f5' }}>
          <Title order={2} fw={900} style={{ fontFamily: 'Greycliff CF, sans-serif', letterSpacing: -0.5, fontSize: '22px' }}>
            SGC
          </Title>
          <Text size="xs" c="dimmed" fw={500}>
            Sistema de Gestão e Controle
          </Text>
        </div>

        {/* Área de Links Agrupados com Submenus */}
        <AppShell.Section component={ScrollArea} grow my="sm" style={{ paddingRight: 4 }}>
          
          {/* 1. DASHBOARD (restrito a ADMIN) */}
          {isAdmin && (
            <NavLink
              label="Dashboard"
              styles={{ label: { fontSize: '14px', fontWeight: 500 } }}
              leftSection={<IconLayoutDashboard size={18} stroke={1.5} />}
              active={location.pathname === '/dashboard'}
              onClick={() => navigate('/dashboard')}
              style={compactNavLinkStyles}
            />
          )}

          {/* 2. ESTRUTURA FÍSICA (GRUPO) */}
          <NavLink
            label="Estrutura Física"
            styles={{ label: { fontSize: '14px', fontWeight: 600 } }}
            leftSection={<IconHierarchy size={18} stroke={1.5} />}
            defaultOpened={isPhysicalStructureActive}
            childrenOffset={20}
            style={compactNavLinkStyles}
            mt={3}
          >
            <NavLink
              label="Empresa"
              styles={{ label: { fontSize: '13px', fontWeight: 500 } }}
              leftSection={<IconBuilding size={16} stroke={1.5} />}
              active={location.pathname === '/company'}
              onClick={() => navigate('/company')}
              style={compactNavLinkStyles}
              mt={2}
            />
            <NavLink
              label="Prédios / Unidades"
              styles={{ label: { fontSize: '13px', fontWeight: 500 } }}
              leftSection={<IconHierarchy size={16} stroke={1.5} />}
              active={location.pathname === '/physical-structure'}
              onClick={() => navigate('/physical-structure')}
              style={compactNavLinkStyles}
              mt={2}
            />
            <NavLink
              label="Setores"
              styles={{ label: { fontSize: '13px', fontWeight: 500 } }}
              leftSection={<IconFolders size={16} stroke={1.5} />}
              active={location.pathname === '/sectors'}
              onClick={() => navigate('/sectors')}
              style={compactNavLinkStyles}
              mt={2}
            />
          </NavLink>

          {/* 3. FUNCIONÁRIOS (somente ADMIN: dados pessoais, LGPD) */}
          {isAdmin && (
            <NavLink
              label="Funcionários"
              styles={{ label: { fontSize: '14px', fontWeight: 500 } }}
              leftSection={<IconUsers size={18} stroke={1.5} />}
              active={location.pathname === '/employees'}
              onClick={() => navigate('/employees')}
              style={compactNavLinkStyles}
              mt={3}
            />
          )}

          {/* 4. CATÁLOGO E PATRIMÔNIO (GRUPO) */}
          <NavLink
            label="Catálogo e Bens"
            styles={{ label: { fontSize: '14px', fontWeight: 600 } }}
            leftSection={<IconBox size={18} stroke={1.5} />}
            defaultOpened={isAssetsCatalogActive}
            childrenOffset={20}
            style={compactNavLinkStyles}
            mt={3}
          >
            <NavLink
              label="Patrimônio (Bens)"
              styles={{ label: { fontSize: '13px', fontWeight: 500 } }}
              leftSection={<IconBarcode size={16} stroke={1.5} />}
              active={location.pathname === '/assets'}
              onClick={() => navigate('/assets')}
              style={compactNavLinkStyles}
              mt={2}
            />
            <NavLink
              label="Categorias de Bens"
              styles={{ label: { fontSize: '13px', fontWeight: 500 } }}
              leftSection={<IconTags size={16} stroke={1.5} />}
              active={location.pathname === '/asset-categories'}
              onClick={() => navigate('/asset-categories')}
              style={compactNavLinkStyles}
              mt={2}
            />
            <NavLink
              label="Produtos / Modelos"
              styles={{ label: { fontSize: '13px', fontWeight: 500 } }}
              leftSection={<IconShoppingBag size={16} stroke={1.5} />}
              active={location.pathname === '/products'}
              onClick={() => navigate('/products')}
              style={compactNavLinkStyles}
              mt={2}
            />
            <NavLink
              label="Marcas"
              styles={{ label: { fontSize: '13px', fontWeight: 500 } }}
              leftSection={<IconCertificate size={16} stroke={1.5} />}
              active={location.pathname === '/brands'}
              onClick={() => navigate('/brands')}
              style={compactNavLinkStyles}
              mt={2}
            />
            <NavLink
              label="Materiais"
              styles={{ label: { fontSize: '13px', fontWeight: 500 } }}
              leftSection={<IconPackage size={16} stroke={1.5} />}
              active={location.pathname === '/materials'}
              onClick={() => navigate('/materials')}
              style={compactNavLinkStyles}
              mt={2}
            />
          </NavLink>

          {/* 5. ORDENS DE SERVIÇO */}
          <NavLink
            label="Ordens de Serviço"
            styles={{ label: { fontSize: '14px', fontWeight: 500 } }}
            leftSection={<IconFiles size={18} stroke={1.5} />}
            active={location.pathname === '/service-orders'}
            onClick={() => navigate('/service-orders')}
            style={compactNavLinkStyles}
            mt={3}
          />

          {/* 6. MOVIMENTAÇÕES */}
          <NavLink
            label="Movimentações"
            styles={{ label: { fontSize: '14px', fontWeight: 500 } }}
            leftSection={<IconReplace size={18} stroke={1.5} />}
            active={location.pathname === '/movements'}
            onClick={() => navigate('/movements')}
            style={compactNavLinkStyles}
            mt={3}
          />

          {/* 7. RELATÓRIOS (somente ADMIN no backend) */}
          {isAdmin && (
            <NavLink
              label="Relatórios"
              styles={{ label: { fontSize: '14px', fontWeight: 500 } }}
              leftSection={<IconFileText size={18} stroke={1.5} />}
              active={location.pathname === '/reports'}
              onClick={() => navigate('/reports')}
              style={compactNavLinkStyles}
              mt={3}
            />
          )}

          {/* 8. USUÁRIOS (somente ADMIN: dados pessoais, LGPD) */}
          {isAdmin && (
            <NavLink
              label="Usuários"
              styles={{ label: { fontSize: '14px', fontWeight: 500 } }}
              leftSection={<IconUserCog size={18} stroke={1.5} />}
              active={location.pathname === '/users'}
              onClick={() => navigate('/users')}
              style={compactNavLinkStyles}
              mt={3}
            />
          )}

          {/* 9. AUDITORIA (somente ADMIN, RF34) */}
          {isAdmin && (
            <NavLink
              label="Auditoria"
              styles={{ label: { fontSize: '14px', fontWeight: 500 } }}
              leftSection={<IconHistory size={18} stroke={1.5} />}
              active={location.pathname === '/audit-logs'}
              onClick={() => navigate('/audit-logs')}
              style={compactNavLinkStyles}
              mt={3}
            />
          )}

        </AppShell.Section>

        {/* Rodapé da Sidebar */}
        <AppShell.Section style={{ borderTop: '1px solid #e9ecef', paddingTop: 14 }}>
          <Group justify="space-between" wrap="nowrap">
            <Group gap="sm" style={{ overflow: 'hidden' }}>
              <Avatar color="teal" radius="xl" size="md">
                {user?.name?.charAt(0).toUpperCase() || 'U'}
              </Avatar>
              <div style={{ overflow: 'hidden' }}>
                <Text size="sm" fw={700} style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', lineHeight: 1.2 }}>
                  {user?.name || 'Usuário'}
                </Text>
                <Text size="xs" style={{ whiteSpace: "nowrap", overflow: 'hidden', textOverflow: 'ellipsis' }} c="dimmed">
                  {user?.email || 'email@naoencontrado.com'}
                </Text>
              </div>
            </Group>
            
            <NavLink
              variant="subtle"
              active={false}
              leftSection={<IconLogout size={20} stroke={1.5} color="#fa5252" />}
              onClick={handleLogout}
              style={{ width: 'auto', padding: 8, borderRadius: 6 }}
              title="Sair do Sistema"
            />
          </Group>
        </AppShell.Section>
      </AppShell.Navbar>

      {/* CONTEÚDO PRINCIPAL DA TELA */}
      <AppShell.Main style={{ backgroundColor: '#f1f3f5', minHeight: '100vh' }}>
        <Outlet /> 
      </AppShell.Main>
    </AppShell>
  );
}