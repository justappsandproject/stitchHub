import 'package:flutter/material.dart';
import 'package:stitchhub_mobile/app.dart';
import 'package:stitchhub_mobile/injection_container.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await initDependencies();
  runApp(const StitchHubApp());
}
