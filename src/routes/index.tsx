// src/routes/index.tsx
import { Routes, Route, Navigate } from "react-router-dom";
import { LoginScreen } from "../pages/Login";
import { DashboardScreen } from "../pages/Dashboard";
import { ProtectedRoute } from "./ProtectedRoute";
import { AppLayout } from "../components/Layout";

// Importações das novas telas do SGC (Padrão: Código em Inglês)
import { CompanyScreen } from "../pages/Company";
import { PhysicalStructureScreen } from "../pages/PhysicalStructure";
import { SectorsScreen } from "../pages/Sectors";
import { EmployeesScreen } from "../pages/Employees";
import { BrandsScreen } from "../pages/Brands";
import { MaterialsScreen } from "../pages/Materials";
import { AssetsScreen } from "../pages/Assets";
import { ServiceOrdersScreen } from "../pages/ServiceOrders";
import { MovementsScreen } from "../pages/Movements";
import { ReportsScreen } from "../pages/Reports";
import { ProductsScreen } from "../pages/Products";
import { AssetCategoriesScreen } from "../pages/AssetCategories";
import { UsersScreen } from "../pages/Users";
import { AuditLogsScreen } from "../pages/AuditLogs";

export function AppRoutes() {
  return (
    <Routes>
      {/* Rota Pública: Tela Inicial / Login */}
      <Route path="/" element={<LoginScreen />} />

      {/* 🔒 Rotas Protegidas e com Layout do Painel */}
      <Route 
        element={
          <ProtectedRoute>
            <AppLayout /> 
          </ProtectedRoute>
        }
      >
        {/* Todas as telas abaixo vão renderizar automaticamente dentro do <Outlet /> do seu AppLayout */}
        <Route path="/dashboard" element={<DashboardScreen />} />
        <Route path="/company" element={<CompanyScreen />} />
        <Route path="/physical-structure" element={<PhysicalStructureScreen />} />
        <Route path="/sectors" element={<SectorsScreen />} />
        <Route path="/employees" element={<EmployeesScreen />} />
        <Route path="/brands" element={<BrandsScreen />} />
        <Route path="/materials" element={<MaterialsScreen />} />
        <Route path="/assets" element={<AssetsScreen />} />
        <Route path="/asset-categories" element={<AssetCategoriesScreen />} />
        <Route path="/products" element={<ProductsScreen />} />
        <Route path="/service-orders" element={<ServiceOrdersScreen />} />
        <Route path="/movements" element={<MovementsScreen />} />
        <Route path="/reports" element={<ReportsScreen />} />
        <Route path="/users" element={<UsersScreen />} />
        <Route path="/audit-logs" element={<AuditLogsScreen />} />
      </Route>

      {/* Rota de Fuga: Qualquer URL inválida joga para o Login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}