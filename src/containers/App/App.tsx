import { Suspense, lazy } from "react";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { MarketplaceAppProvider } from "../../common/providers/MarketplaceAppProvider";
import { Route, Routes } from "react-router-dom";
import { CustomFieldExtensionProvider } from "../../common/providers/CustomFieldExtensionProvider";
import { EntrySidebarExtensionProvider } from "../../common/providers/EntrySidebarExtensionProvider";
import { AppConfigurationExtensionProvider } from "../../common/providers/AppConfigurationExtensionProvider";

// Lazy-loaded components grouped by functionality
const DefaultPage = lazy(() => import("../index"));

// Custom Fields
const CustomFieldAssetSelector = lazy(() => import("../CustomFieldAssetSelector/CustomField"));
const CustomFieldValidation = lazy(() => import("../CustomFieldValidation/CustomField"));
const CustomFieldDynamic = lazy(() => import("../CustomFieldDynamicUrl/CustomField"));
const CustomFieldCollaboration = lazy(() => import("../CustomFieldCollaboration/CustomField"));

// Sidebar Extensions
const SidebarDeepClone = lazy(() => import("../SideBarDeepClone/EntrySideBar"));
const SidebarResetEntry = lazy(() => import("../SideBarResetEntry/SideBar"));
const SidebarTranslate = lazy(() => import("../SideBarTranslate/EntrySidebar"));
const SidebarBoilerplate = lazy(() => import("../SidebarBoilerplate/EntrySideBar"));
const SidebarReferences = lazy(() => import("../SidebarReferencesWidget/EntrySidebar"));
const SidebarPublishedLanguages = lazy(() => import("../SideBarTranslate/EntrySidebar"));
const SidebarAsset = lazy(() => import("../AssetSidebarWidget/AssetSidebar"));

// Dashboard
const DashboardStack = lazy(() => import("../DashboardWidgetAiSearch/StackDashboard"));

// Configurations
const ConfigAppScreen = lazy(() => import("../ConfigScreen/AppConfiguration"));

// Full Page
const FullPageExtension = lazy(() => import("../FullPage/FullPage"));

// Miscellaneous
const NotFoundPage = lazy(() => import("../404/404"));
const FieldModifier = lazy(() => import("../FieldModifier/FieldModifier"));

function App() {
  return (
    <ErrorBoundary>
      <MarketplaceAppProvider>
        <Routes>
          <Route path="/" element={<DefaultPage />} />

          {/* Custom Fields */}
          <Route
            path="/custom-field-asset-selector"
            element={
              <Suspense>
                <CustomFieldExtensionProvider>
                  <CustomFieldAssetSelector />
                </CustomFieldExtensionProvider>
              </Suspense>
            }
          />
          <Route
            path="/custom-field-validation"
            element={
              <Suspense>
                <CustomFieldExtensionProvider>
                  <CustomFieldValidation />
                </CustomFieldExtensionProvider>
              </Suspense>
            }
          />
          <Route
            path="/custom-field-dynamic"
            element={
              <Suspense>
                <CustomFieldExtensionProvider>
                  <CustomFieldDynamic />
                </CustomFieldExtensionProvider>
              </Suspense>
            }
          />
          <Route
            path="/custom-field-collaboration"
            element={
              <Suspense>
                <CustomFieldExtensionProvider>
                  <CustomFieldCollaboration />
                </CustomFieldExtensionProvider>
              </Suspense>
            }
          />

          {/* Sidebars */}
          <Route
            path="/sidebar-deep-clone"
            element={
              <Suspense>
                <CustomFieldExtensionProvider>
                  <SidebarDeepClone />
                </CustomFieldExtensionProvider>
              </Suspense>
            }
          />
          <Route
            path="/sidebar-reset-entry"
            element={
              <Suspense>
                <CustomFieldExtensionProvider>
                  <SidebarResetEntry />
                </CustomFieldExtensionProvider>
              </Suspense>
            }
          />
          <Route
            path="/sidebar-translate"
            element={
              <Suspense>
                <CustomFieldExtensionProvider>
                  <SidebarTranslate />
                </CustomFieldExtensionProvider>
              </Suspense>
            }
          />
          <Route
            path="/sidebar-boilerplate"
            element={
              <Suspense>
                <EntrySidebarExtensionProvider>
                  <SidebarBoilerplate />
                </EntrySidebarExtensionProvider>
              </Suspense>
            }
          />
          <Route
            path="/sidebar-references"
            element={
              <Suspense>
                <EntrySidebarExtensionProvider>
                  <SidebarReferences />
                </EntrySidebarExtensionProvider>
              </Suspense>
            }
          />
          <Route
            path="/sidebar-published-languages"
            element={
              <Suspense>
                <CustomFieldExtensionProvider>
                  <SidebarPublishedLanguages />
                </CustomFieldExtensionProvider>
              </Suspense>
            }
          />

          {/* Asset Sidebar */}
          <Route
            path="/sidebar-asset"
            element={
              <Suspense>
                <SidebarAsset />
              </Suspense>
            }
          />

          {/* Dashboard */}
          <Route
            path="/stack-dashboard"
            element={
              <Suspense>
                <DashboardStack />
              </Suspense>
            }
          />

          {/* Configuration Screen */}
          <Route
            path="/app-config"
            element={
              <Suspense>
                <AppConfigurationExtensionProvider>
                  <ConfigAppScreen />
                </AppConfigurationExtensionProvider>
              </Suspense>
            }
          />

          {/* Full Page */}
          <Route
            path="/full-page"
            element={
              <Suspense>
                <FullPageExtension />
              </Suspense>
            }
          />

          {/* Miscellaneous */}
          <Route
            path="/field-modifier"
            element={
              <Suspense>
                <FieldModifier />
              </Suspense>
            }
          />
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </MarketplaceAppProvider>
    </ErrorBoundary>
  );
}

export default App;
