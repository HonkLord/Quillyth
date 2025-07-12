# Campaign Manager - Development Workflow

This document outlines the standardized process for developing new features for the Campaign Manager application.

## 🔄 **Development Process**

### **1. Before Starting Any Feature**

1.  **📖 Understand the Architecture**
    -   **Always start by reading `ARCHITECTURE.md`**. This is the single source of truth for the application's structure, components, and data flow.
    -   Pay close attention to the **System Interaction Matrix** to understand how your new feature will integrate with existing components.

2.  **⚙️ Review Technical Specifications**
    -   Check `TECHNICAL_SPECS.md` for detailed database schemas and API endpoint specifications that you may need to use or extend.

3.  **🔍 Analyze Existing Code**
    -   Search the codebase for similar features or components.
    -   Prioritize reusing existing functions, CSS classes, and components to maintain consistency.

4.  **📝 Plan Your Work**
    -   Create a task list for your feature.
    -   If you need to make changes to the architecture (e.g., add a new service or a major component), **update `ARCHITECTURE.md` first**.
    -   If you need to make changes to the database or API, **document them in `TECHNICAL_SPECS.md`**.

### **2. During Development**

1.  **🏗️ Follow Implementation Standards**
    -   Adhere to the existing code patterns, naming conventions, and file structures.
    -   Use ES6 modules and write clear, readable code.
    -   Implement proper error handling and provide user feedback for all actions.

2.  **🔗 Ensure System Integration**
    -   Continuously refer to the **System Interaction Matrix** in `ARCHITECTURE.md`.
    -   Test that data flows correctly between your new feature and any dependent systems.
    -   Avoid hard-coded values, especially the campaign ID.

3.  **📊 Keep Documentation Live**
    -   If you make a change that affects the architecture or technical specifications, **update the relevant markdown file immediately**. Live documentation is a core principle of this project.

### **3. After Feature Completion**

1.  **🧪 Test and Verify**
    -   Test the feature thoroughly in isolation.
    -   Verify its integration with all dependent systems.
    -   Test for error scenarios and edge cases.

2.  **📚 Finalize Documentation**
    -   Ensure `ARCHITECTURE.md` and `TECHNICAL_SPECS.md` are fully updated with your changes.
    -   Add a summary of your changes to the commit message.

3.  **💾 Commit Your Work**
    -   Use a clear and descriptive commit message that explains the "what" and the "why" of your changes.

## 🚨 **Red Flags to Watch For**

-   **Architecture Violations:** Directly accessing the database from the frontend, bypassing `ApiService`, or failing to use the established component structure.
-   **Hard-coded Data:** Adding fixed values (like names, IDs, or numbers) that should be dynamic.
-   **Missing Integration:** Components that don't refresh when data changes, or broken navigation between features.
-   **Code Duplication:** Writing a function or a CSS style that already exists in a reusable component or utility file. **Always check `ARCHITECTURE.md` and the `css/components` directory first.**

---

**Remember**: The goal is to build a cohesive, integrated system. Always think about the whole application, not just the feature you're building.
