# Generated by Django 5.0.8 on 2024-08-29 11:31

import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("authentik_stages_captcha", "0003_captchastage_error_on_invalid_score_and_more"),
        ("authentik_stages_identification", "0014_identificationstage_pretend"),
    ]

    operations = [
        migrations.AddField(
            model_name="identificationstage",
            name="captcha_stage",
            field=models.ForeignKey(
                default=None,
                help_text="When set, adds functionality exactly like a Captcha stage, but baked into the Identification stage.",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="authentik_stages_captcha.captchastage",
            ),
        ),
    ]
