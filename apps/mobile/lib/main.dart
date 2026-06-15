import 'package:flutter/material.dart';
import 'package:stitchhub_mobile/app.dart';
import 'package:stitchhub_mobile/core/firebase/firebase_bootstrap.dart';
import 'package:stitchhub_mobile/injection_container.dart';

Future<void> main() async {
  WidgetsFlutterBinding.ensureInitialized();
  await bootstrapFirebase();
  await initDependencies();
  runApp(const StitchHubApp());
}
