
#  Contentstack Marketplace App Boilerplate

  This project assumes you have a project set up in the Developer Hub already.
  - [Marketplace App Boilerplate Documentation](https://www.contentstack.com/docs/developers/developer-hub/marketplace-app-boilerplate/)
- [Marketplace Boiler Plate](https://github.com/contentstack/marketplace-app-boilerplate)

**Disclaimer**: The code provided herein is intended solely for demonstration and proof-of-concept purposes. It is NOT intended for production use, nor should it be used in any environment or application where its failure or misbehavior could lead to direct or indirect harm, loss, or damage.

Users are strongly advised to thoroughly review, test, and, if necessary, modify the code before considering its use in any real-world or production scenario.

By using or implementing this code, you acknowledge and accept all risks associated with its use and agree to hold harmless the author(s) or provider(s) from any and all claims, damages, or liabilities.



# App List

##  Check Parent References - Sidebar Widget

#### Description
The check parent references sidebar widget that will show you all content that is associated with it. It will display how many levels of depth above the parent references are as well.

#### Location
This app is based on the [sidebar location](https://github.com/nicknguyen-cs/sample-apps/blob/main/src/containers/SidebarReferencesWidget/EntrySidebar.tsx)

#### Demo
![My Image](public/gifs/parent-references.gif)

#### Install & Use Instructions

 - Install the app via Developer Hub and host it locally or with a provider
 - API Key and Management Token are needed to access the functionality and the app requires the config variables.
 - Open an entry, and locate the widgets section. Find what you named the app location and it should populate a list of all connected content.

## Reset Localization - Sidebar Widget

This app is based on the [sidebar location](https://github.com/nicknguyen-cs/sample-apps/tree/main/src/containers/SideBarResetEntry)Users can go to the sidebar and click a button that will reset an entry back to an empty slate. Easy to start a new localization from scratch. Users will need to refresh the page to see the empty updated entry.

#### Demo
![My Image](public/gifs/reset-locale.gif)


## Dynamic URL - Custom Field

This custom field is based on the [custom field location](https://github.com/nicknguyen-cs/sample-apps/tree/main/src/containers/CustomFieldDynamicUrl). It will take the current locale and pre-pend it to a current url field. So if you're current URL field is "/category/jacket" it will convert it to "/{locale}/category/jacket". The logic can be fine tuned to match your folder structure if needed. 

#### Demo
![Dynamic URL](public/gifs/dynamic-url.gif)

## Sidebar Widget for CMS

### Overview
This Sidebar Widget efficiently clones an existing entry and all its references, ensuring the newly created entries are interconnected and refer to the new cloned data. It simplifies the process of duplicating complex entries while maintaining data integrity and consistency. Note: This widget does not clone assets.

### Features
- **Clone Entry and References**: Quickly duplicates any entry along with its references.
- **Relink Cloned Data**: Automatically updates links in the cloned data to point to the new entries.
- **User-Friendly Interface**: Easy to use sidebar widget integrated into your CMS.
- **Locale Cloning**: A checkbox for deep cloning with localized languages as well.

## Usage
1. Open the CMS and navigate to the entry you want to clone.
2. Click on the Sidebar Widget in the entry screen.
3. Select the "Clone Entry" button to open the modal.
4. Select if you would like to clone all locales as well, and click clone
5. A table with every cloned entry and localization will show during process.
