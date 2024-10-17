import React, { Suspense } from "react";
import { ErrorBoundary } from "../../components/ErrorBoundary";
import { MarketplaceAppProvider } from "../../common/providers/MarketplaceAppProvider";
import { Route, Routes } from "react-router-dom";
import { EntrySidebarExtensionProvider } from "../../common/providers/EntrySidebarExtensionProvider";
import { AppConfigurationExtensionProvider } from "../../common/providers/AppConfigurationExtensionProvider";
import { CustomFieldExtensionProvider } from "../../common/providers/CustomFieldExtensionProvider";
import FieldModifierExtension from "../FieldModifier/FieldModifier";

/**
 * All the routes are Lazy loaded.
 * This will ensure the bundle contains only the core code and respective route bundle
 * improving the page load time
 */
const CustomFieldExtension = React.lazy(() => import("../CustomField/CustomField"));
const CustomFieldDisplay = React.lazy(() => import("../CustomFieldDisplay/CustomField"));
const CustomFieldDynamicUrl = React.lazy(() => import("../CustomFieldDynamicUrl/CustomField"));
const CustomFieldValidation = React.lazy(() => import("../CustomFieldValidation/CustomField"));
const SideBarDeepCloneExtension = React.lazy(() => import("../SideBarDeepClone/EntrySideBar"));
const SideBarTranslate = React.lazy(() => import("../SideBarTranslate/EntrySidebar"));
const SideBarLanguages = React.lazy(() => import("../SidebarPublishedLanguages/EntrySidebar"));
const SideBarResetEntryExtension = React.lazy(() => import("../SideBarResetEntry/SideBar"));
const EntrySidebarExtension = React.lazy(() => import("../SidebarReferencesWidget/EntrySidebar"));
const AppConfigurationExtension = React.lazy(() => import("../ConfigScreen/AppConfiguration"));
const AssetSidebarExtension = React.lazy(() => import("../AssetSidebarWidget/AssetSidebar"));
const StackDashboardExtension = React.lazy(() => import("../DashboardWidget/StackDashboard"));
const FullPageExtension = React.lazy(() => import("../FullPage/FullPage"));
const PageNotFound = React.lazy(() => import("../404/404"));
const DefaultPage = React.lazy(() => import("../index"));

function App() {
  return (
    <ErrorBoundary>
      <MarketplaceAppProvider>
        <Routes>
          <Route path="/" element={<DefaultPage />} />
          <Route
            path="/custom-field-display"
            element={
              <Suspense>
                <CustomFieldExtensionProvider>
                  <CustomFieldDisplay />
                </CustomFieldExtensionProvider>
              </Suspense>
            }
          />
          <Route
            path="/custom-field"
            element={
              <Suspense>
                <CustomFieldExtensionProvider>
                  <CustomFieldExtension />
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
            path="/custom-field-dynamic-url"
            element={
              <Suspense>
                <CustomFieldExtensionProvider>
                  <CustomFieldDynamicUrl />
                </CustomFieldExtensionProvider>
              </Suspense>
            }
          />
          <Route
            path="/sidebar-extension-deep-clone"
            element={
              <Suspense>
                <CustomFieldExtensionProvider>
                  <SideBarDeepCloneExtension />
                </CustomFieldExtensionProvider>
              </Suspense>
            }
          />
          <Route
            path="/sidebar-extension-reset-entry"
            element={
              <Suspense>
                <CustomFieldExtensionProvider>
                  <SideBarResetEntryExtension />
                </CustomFieldExtensionProvider>
              </Suspense>
            }
          />
          <Route
            path="/entry-sidebar"
            element={
              <Suspense>
                <EntrySidebarExtensionProvider>
                  <EntrySidebarExtension />
                </EntrySidebarExtensionProvider>
              </Suspense>
            }
          />
          <Route
            path="/app-configuration"
            element={
              <Suspense>
                <AppConfigurationExtensionProvider>
                  <AppConfigurationExtension />
                </AppConfigurationExtensionProvider>
              </Suspense>
            }
          />
          <Route
            path="/asset-sidebar"
            element={
              <Suspense>
                <AssetSidebarExtension />
              </Suspense>
            }
          />
          <Route
            path="/stack-dashboard"
            element={
              <Suspense>
                <StackDashboardExtension />
              </Suspense>
            }
          />
          <Route
            path="/full-page"
            element={
              <Suspense>
                <FullPageExtension />
              </Suspense>
            }
          />
          <Route
            path="/field-modifier"
            element={
              <Suspense>
                <FieldModifierExtension />
              </Suspense>
            }
          />
          <Route
            path="/entry-sidebar-languages"sidebar-extension-translate
            element={
              <Suspense>
                <CustomFieldExtensionProvider>
                  <SideBarLanguages />
                </CustomFieldExtensionProvider>
              </Suspense>
            }
          />
          <Route
            path="/sidebar-extension-translate"
            element={
              <Suspense>
                <CustomFieldExtensionProvider>
                  <SideBarTranslate />
                </CustomFieldExtensionProvider>
              </Suspense>
            }
          />
          <Route path="*" element={<PageNotFound />} />
        </Routes>
      </MarketplaceAppProvider>
    </ErrorBoundary>
  );
}

export default App;
