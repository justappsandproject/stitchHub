import 'package:flutter/material.dart';
import 'package:go_router/go_router.dart';
import 'package:stitchhub_mobile/core/constants/enums.dart';
import 'package:stitchhub_mobile/core/utils/role_utils.dart';
import 'package:stitchhub_mobile/domain/entities/user_entity.dart';
import 'package:stitchhub_mobile/presentation/pages/admin/admin_home_page.dart';
import 'package:stitchhub_mobile/presentation/pages/admin/admin_messages_page.dart';
import 'package:stitchhub_mobile/presentation/pages/admin/admin_tenants_page.dart';
import 'package:stitchhub_mobile/presentation/pages/auth/forgot_password_page.dart';
import 'package:stitchhub_mobile/presentation/pages/auth/login_page.dart';
import 'package:stitchhub_mobile/presentation/pages/auth/register_customer_page.dart';
import 'package:stitchhub_mobile/presentation/pages/auth/reset_password_page.dart';
import 'package:stitchhub_mobile/presentation/pages/customer/customer_home_page.dart';
import 'package:stitchhub_mobile/presentation/pages/customer/customer_measurements_page.dart';
import 'package:stitchhub_mobile/presentation/pages/designer/orders_page.dart'
    show CustomerOrdersPage, OrdersPage;
import 'package:stitchhub_mobile/presentation/pages/designer/billing_page.dart';
import 'package:stitchhub_mobile/presentation/pages/designer/customers_page.dart';
import 'package:stitchhub_mobile/presentation/pages/designer/designer_discounts_page.dart';
import 'package:stitchhub_mobile/presentation/pages/designer/designer_home_page.dart';
import 'package:stitchhub_mobile/presentation/pages/designer/designer_measurements_page.dart';
import 'package:stitchhub_mobile/presentation/pages/designer/designer_portfolio_page.dart';
import 'package:stitchhub_mobile/presentation/pages/designer/messages_page.dart';
import 'package:stitchhub_mobile/presentation/pages/customer/customer_portfolio_page.dart';
import 'package:stitchhub_mobile/presentation/pages/customer/customer_styles_page.dart';
import 'package:stitchhub_mobile/presentation/pages/customer/customer_style_detail_page.dart';
import 'package:stitchhub_mobile/presentation/pages/designer/create_order_page.dart';
import 'package:stitchhub_mobile/presentation/pages/designer/customer_detail_page.dart';
import 'package:stitchhub_mobile/presentation/pages/designer/designer_styles_page.dart';
import 'package:stitchhub_mobile/presentation/pages/designer/designer_inventory_page.dart';
import 'package:stitchhub_mobile/presentation/pages/shared/plan_detail_page.dart';
import 'package:stitchhub_mobile/presentation/pages/shared/settings_page.dart';
import 'package:stitchhub_mobile/presentation/pages/splash_page.dart';

typedef AuthUserResolver = UserEntity? Function();

class AppRouter {
  static const login = '/login';
  static const forgotPassword = '/forgot-password';
  static const resetPassword = '/reset-password';
  static const registerCustomer = '/register/customer';
  static const splash = '/';
  static const adminHome = '/admin';
  static const adminTenants = '/admin/tenants';
  static const adminMessages = '/admin/messages';
  static const designerHome = '/designer';
  static const designerOrders = '/designer/orders';
  static const designerCustomers = '/designer/customers';
  static const designerMessages = '/designer/messages';
  static const designerBilling = '/designer/billing';
  static const designerPortfolio = '/designer/portfolio';
  static const designerDiscounts = '/designer/discounts';
  static const designerMeasurements = '/designer/measurements';
  static const customerHome = '/customer';
  static const customerOrders = '/customer/orders';
  static const customerMeasurements = '/customer/measurements';
  static const designerStyles = '/designer/styles';
  static const designerInventory = '/designer/inventory';
  static const designerCustomerDetail = '/designer/customers';
  static const customerStyles = '/customer/styles';
  static const customerPortfolio = '/customer/portfolio';
  static const settings = '/settings';

  static const designerCreateOrder = '/designer/orders/new';
  static const planDetail = '/settings/plan';

  static GoRouter create({
    AuthUserResolver? user,
    Listenable? refreshListenable,
  }) {
    UserEntity? resolveUser() => user?.call();

    return GoRouter(
      initialLocation: splash,
      refreshListenable: refreshListenable,
      redirect: (context, state) {
        final path = state.matchedLocation;
        final currentUser = resolveUser();
        final loggingIn = path == login;
        final registering = path == registerCustomer;
        final recovering = path == forgotPassword || path.startsWith(resetPassword);

        if (currentUser == null) {
          if (path == splash || loggingIn || registering || recovering) return null;
          return login;
        }

        if (loggingIn || registering || recovering || path == splash) {
          return homeForRole(currentUser.role);
        }

        if (path.startsWith('/admin') && !isSuperAdmin(currentUser.role)) {
          return homeForRole(currentUser.role);
        }
        if (path.startsWith('/designer') && !isStaff(currentUser.role)) {
          return homeForRole(currentUser.role);
        }
        if (path.startsWith('/customer') && !isCustomer(currentUser.role)) {
          return homeForRole(currentUser.role);
        }

        return null;
      },
      routes: [
        GoRoute(path: splash, builder: (_, __) => const SplashPage()),
        GoRoute(path: login, builder: (_, __) => const LoginPage()),
        GoRoute(path: forgotPassword, builder: (_, __) => const ForgotPasswordPage()),
        GoRoute(
          path: resetPassword,
          builder: (context, state) => ResetPasswordPage(
            initialToken: state.uri.queryParameters['token'],
          ),
        ),
        GoRoute(
          path: registerCustomer,
          builder: (_, __) => const RegisterCustomerPage(),
        ),
        GoRoute(path: settings, builder: (_, __) => const SettingsPage()),
        GoRoute(path: planDetail, builder: (_, __) => const PlanDetailPage()),
        GoRoute(path: adminHome, builder: (_, __) => const AdminHomePage()),
        GoRoute(path: adminTenants, builder: (_, __) => const AdminTenantsPage()),
        GoRoute(path: adminMessages, builder: (_, __) => const AdminMessagesPage()),
        GoRoute(path: designerHome, builder: (_, __) => const DesignerHomePage()),
        GoRoute(path: designerOrders, builder: (_, __) => const OrdersPage()),
        GoRoute(path: designerCreateOrder, builder: (_, __) => const CreateOrderPage()),
        GoRoute(path: designerCustomers, builder: (_, __) => const CustomersPage()),
        GoRoute(
          path: designerMeasurements,
          builder: (context, state) => DesignerMeasurementsPage(
            customerId: state.uri.queryParameters['customerId'],
            customerName: state.uri.queryParameters['name'],
          ),
        ),
        GoRoute(path: designerMessages, builder: (_, __) => const MessagesPage()),
        GoRoute(path: designerBilling, builder: (_, __) => const BillingPage()),
        GoRoute(path: designerPortfolio, builder: (_, __) => const DesignerPortfolioPage()),
        GoRoute(path: designerDiscounts, builder: (_, __) => const DesignerDiscountsPage()),
        GoRoute(path: designerStyles, builder: (_, __) => const DesignerStylesPage()),
        GoRoute(path: designerInventory, builder: (_, __) => const DesignerInventoryPage()),
        GoRoute(
          path: '$designerCustomerDetail/:id',
          builder: (context, state) => CustomerDetailPage(
            customerId: state.pathParameters['id']!,
          ),
        ),
        GoRoute(path: customerHome, builder: (_, __) => const CustomerHomePage()),
        GoRoute(path: customerStyles, builder: (_, __) => const CustomerStylesPage()),
        GoRoute(
          path: '$customerStyles/:id',
          builder: (context, state) => CustomerStyleDetailPage(
            styleId: state.pathParameters['id']!,
          ),
        ),
        GoRoute(path: customerOrders, builder: (_, __) => const CustomerOrdersPage()),
        GoRoute(path: customerMeasurements, builder: (_, __) => const CustomerMeasurementsPage()),
        GoRoute(path: customerPortfolio, builder: (_, __) => const CustomerPortfolioPage()),
      ],
    );
  }

  static String homeForRole(UserRole role) {
    if (isSuperAdmin(role)) return adminHome;
    if (isStaff(role)) return designerHome;
    return customerHome;
  }
}
