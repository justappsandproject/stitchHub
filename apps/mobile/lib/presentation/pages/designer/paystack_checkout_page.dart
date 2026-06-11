import 'package:flutter/material.dart';
import 'package:stitchhub_mobile/injection_container.dart';
import 'package:stitchhub_mobile/presentation/blocs/billing/billing_bloc.dart';
import 'package:webview_flutter/webview_flutter.dart';

class PaystackCheckoutPage extends StatefulWidget {
  const PaystackCheckoutPage({
    super.key,
    required this.authorizationUrl,
    required this.reference,
  });

  final String authorizationUrl;
  final String reference;

  @override
  State<PaystackCheckoutPage> createState() => _PaystackCheckoutPageState();
}

class _PaystackCheckoutPageState extends State<PaystackCheckoutPage> {
  late final WebViewController _controller;
  var _verified = false;

  @override
  void initState() {
    super.initState();
    _controller = WebViewController()
      ..setJavaScriptMode(JavaScriptMode.unrestricted)
      ..setNavigationDelegate(
        NavigationDelegate(
          onPageFinished: (url) {
            if (url.contains('reference=') && !_verified) {
              _verified = true;
              sl<BillingBloc>().add(BillingPaystackVerify(widget.reference));
              Navigator.of(context).pop();
            }
          },
        ),
      )
      ..loadRequest(Uri.parse(widget.authorizationUrl));
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Paystack Checkout')),
      body: WebViewWidget(controller: _controller),
    );
  }
}
